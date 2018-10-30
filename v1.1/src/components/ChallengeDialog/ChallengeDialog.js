import React, {Component} from 'react';
import AppBar from "@material-ui/core/AppBar/AppBar";
import Toolbar from "@material-ui/core/Toolbar/Toolbar";
import CloseIcon from '@material-ui/icons/Close';
import Button from "@material-ui/core/Button/Button";
import classes from "./ChallengeDialog.module.css";
import AddQuestion from "../AddQuestion/AddQuestion";
import List from "@material-ui/core/List/List";
import TextField from "@material-ui/core/TextField/TextField";
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import IconButton from "@material-ui/core/IconButton/IconButton";
import Typography from "@material-ui/core/Typography/Typography";
import Dialog from "@material-ui/core/Dialog/Dialog";
import Slide from "@material-ui/core/Slide/Slide";
import fire from "../../fire";
import EditQuestionListItem from "../EditQuestionListItem/EditQuestionListItem";
import Divider from "@material-ui/core/Divider/Divider";
import FormControl from "@material-ui/core/FormControl/FormControl";
import FormLabel from "@material-ui/core/FormLabel/FormLabel";
import FormHelperText from "@material-ui/core/FormHelperText/FormHelperText";


function Transition(props) {
    return <Slide direction="up" {...props} />;
}

class ChallengeDialog extends Component {

    initialState = {
        challengeId: null,
        questions: [],
        isPartial: true,
        title: {
            value: '',
            error: '',
            focused: false,
            valid: false
        },
        description: {
            value: '',
            error: '',
            focused: false,
            valid: true
        }
    };

    state = {
        challengeId: null,
        questions: [],
        title: {
            value: '',
            error: '',
            focused: false,
            valid: false
        },
        description: {
            value: '',
            error: '',
            focused: false,
            valid: true
        }
    };

    handleSave = () => {
        this.props.closed();
        this.writeChallenge();
    };

    writeChallenge = () => {
        // Write the challenge title, description and isPartial,
        // since the questions are already in the database by now.
        const updates = {};
        updates['/challenges/' + this.state.challengeId + '/title'] = this.state.title.value;
        updates['/challenges/' + this.state.challengeId + '/description'] = this.state.description.value;
        updates['/challenges/' + this.state.challengeId + '/isPartial'] = false;

        fire.database().ref().update(updates)
            .then(() => {console.log('The challenge was saved in the database.')})
            .catch(error => {alert(error.message)});
    };

    writePartialChallenge = () => {
        // Write the challenge title, description and isPartial,
        // since the questions are already in the database by now.
        const updates = {};
        updates['/challenges/' + this.state.challengeId + '/title'] = this.state.title.value;
        updates['/challenges/' + this.state.challengeId + '/description'] = this.state.description.value;

        fire.database().ref().update(updates)
            .then(() => {console.log('The partial challenge was saved in the database.')})
            .catch(error => {alert(error.message)});
    };

    checkFormValidity = () => {
        let validForm = true;
        const form = {...this.state};
        for (let element in form) {
            if (element === 'questions') {
                validForm = validForm && form[element].length !== 0;
            } else if (element !== 'open' && element !== 'challengeId' && element !== 'isPartial') {
                validForm = validForm && form[element].valid;
            }
        }
        return validForm;
    };

    setListeners = (challengeId) => {
        fire.database().ref('/challenges/' + challengeId + '/questions')
            .on('child_added', questionId => {
                fire.database().ref('/questions/' + questionId.val()).once('value')
                    .then(snapshot => {
                        const updatedQuestions = [...this.state.questions];
                        const question = snapshot.val();
                        question.id = questionId.val();
                        question.key = questionId.key;
                        updatedQuestions.push(question);
                        console.log('Updated Questions', updatedQuestions);
                        this.setState({questions: updatedQuestions});
                    })
                    .catch(error => {
                        alert(error.message);
                    });
            });

        fire.database().ref('/challenges/' + challengeId + '/questions')
            .on('child_removed', snapshot => {
                const questionKey = snapshot.key;
                const updatedQuestions = this.state.questions
                    .filter(question => (question.key !== questionKey));
                this.setState({questions: updatedQuestions})
            });

        fire.database().ref('/questions/')
            .on('child_changed', snapshot => {
                if (snapshot.val().challenge === challengeId) {
                    const questionId = snapshot.key;
                    const updatedQuestions = [...this.state.questions];
                    const oldQuestionIndex = updatedQuestions
                        .findIndex((question) => (question.id === questionId));
                    const oldQuestion = {...updatedQuestions[oldQuestionIndex]};
                    const updatedQuestion = snapshot.val();
                    updatedQuestion.id = questionId;
                    updatedQuestion.key = oldQuestion.key;
                    updatedQuestions[oldQuestionIndex] = updatedQuestion;
                    this.setState({questions: updatedQuestions});
                }
            });
    };

    initializeStateFromProps = () => {
        const propsState = {
            challengeId: this.props.challenge.id,
            // TODO: The assumption here is that the questions will already be in the form needed by the EditQuestionListItem Component.
            questions: [...this.props.challenge.questions],
            title: {
                value: this.props.challenge.title,
                error: '',
                focused: false,
                valid: true
            },
            description: {
                value: this.props.challenge.description,
                error: '',
                focused: false,
                valid: true
            }
        };
        this.setState(propsState);
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Get ID for the new challenge.
        if (prevProps.open === false && this.props.open === true) {
            if (!this.props.challenge) {
                this.setState(this.initialState);
                // Also initialize the challenge isPartial to true.
                fire.database().ref().child('challenges').push({isPartial: true})
                    .then(response => {
                        console.log('Challenge Id' + response.key);
                        this.setListeners(response.key);
                        this.setState({challengeId: response.key});
                    });
            } else {
                this.initializeStateFromProps();
                this.setListeners(this.props.challenge.id)
            }
        }
    }

    checkValidity = (name, element) => {
        switch (name) {
            case 'title':
                return this.checkTitle(element);
            case 'description':
                return this.checkDescription(element);
            default:
                return '';
        }
    };

    checkTitle = (title) => {
        if (title.value.length === 0 && title.focused) {
            return '* Required';
        } else if (title.value.length > 50) {
            return 'Cannot be longer than 50 characters';
        } else {
            return '';      // No error
        }
    };

    checkDescription = (description) => {
        if (description.value.length > 200) {
            return 'Cannot be longer than 200 characters';
        } else {
            return '';      // No error
        }
    };

    getQuestionsError = () => {
      if (this.state.questions.length === 0) {
          return 'You must add at least 1 question to the challenge';
      } else {
          return '';        // No error
      }
    };

    handleFieldChange = name => event => {
        const updatedField = {...this.state[name]};
        updatedField.value = event.target.value;
        updatedField.error = this.checkValidity(name, updatedField);
        updatedField.valid = updatedField.error.length === 0;
        this.setState({[name]: updatedField});
    };

    handleFieldFocus = name => () => {
        const updatedField = {...this.state[name]};
        if (!updatedField.focused) {
            updatedField.focused = true;
            updatedField.error = this.checkValidity(name, updatedField);
            this.setState({[name]: updatedField});
        }
    };

    render() {

        const questionsError = this.getQuestionsError();

        const validForm = this.checkFormValidity();

        const questionItems = this.state.questions.map((question, index) => (
            <div key={question.key}>
                <EditQuestionListItem question={question} index={index + 1}/>
                <Divider/>
            </div>
        ));

        return (
            <Dialog
                fullScreen
                open={this.props.open}
                onClose={this.props.closed}
                TransitionComponent={Transition}
            >
                <AppBar style={{position: 'relative'}}>
                    <Toolbar>
                        <IconButton color="inherit" onClick={this.props.closed} aria-label="Close">
                            <CloseIcon/>
                        </IconButton>
                        <Typography variant="h6" color="inherit" style={{flex: '1'}}>
                            New Challenge
                        </Typography>
                        <Button
                            color="inherit"
                            onClick={this.handleSave}
                            disabled={!validForm}
                        >
                            Save
                        </Button>
                    </Toolbar>
                </AppBar>

                <DialogContent className={classes.root}>
                    <TextField
                        label="Title"
                        multiline
                        rowsMax="4"
                        margin="normal"
                        fullWidth
                        error={this.state.title.error.length > 0}
                        helperText={this.state.title.error}
                        value={this.state.title.value}
                        onChange={this.handleFieldChange('title')}
                        onFocus={this.handleFieldFocus('title')}
                    />
                    <TextField
                        label="Description"
                        multiline
                        rowsMax="4"
                        margin="normal"
                        fullWidth
                        error={this.state.description.error.length > 0}
                        helperText={this.state.description.error}
                        value={this.state.description.value}
                        onChange={this.handleFieldChange('description')}
                        onFocus={this.handleFieldFocus('description')}
                    />

                    <FormControl
                        error={questionsError.length > 0}
                        style={{width: '100%'}}
                    >
                        <FormLabel component="label">Questions</FormLabel>
                        {(questionsError.length > 0) ? <FormHelperText>{questionsError}</FormHelperText> : null}
                    </FormControl>
                    <List>
                        {questionItems}
                    </List>
                    <AddQuestion
                        challengeId={this.state.challengeId}
                        savePartial={this.writePartialChallenge}
                    />
                </DialogContent>
            </Dialog>
        );
    }
}

export default ChallengeDialog;