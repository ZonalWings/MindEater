import React, {Component} from 'react';
import {Button} from "@material-ui/core";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent/DialogContent";
import DialogActions from "@material-ui/core/DialogActions/DialogActions";
import withMobileDialog from "@material-ui/core/es/withMobileDialog/withMobileDialog";

import classes from './CreateQuestionDialog.module.css';
import TextField from "@material-ui/core/TextField/TextField";
import Options from "./Options/Options";
import fire from "../../fire";

class CreateQuestionDialog extends Component {

    state = {
        questionId: null,
        open: false,
        optionsValue: null,
        correctOption: null,
        question: {
            value: '',
            error: '',
            focused: false,
            valid: false
        },
        hint: {
            value: '',
            error: '',
            focused: false,
            valid: false
        },
        explanation: {
            value: '',
            error: '',
            focused: false,
            valid: false
        },

        options: {
            value: [
                {
                    value: '',
                    error: '',
                    focused: false,
                },
                {
                    value: '',
                    error: '',
                    focused: false,
                },
                {
                    value: '',
                    error: '',
                    focused: false,
                },
                {
                    value: '',
                    error: '',
                    focused: false,
                }
            ],
            error: '',
            focused: false,
            valid: false
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Get a ID for the new question.
        if(prevState.open === false && this.state.open === true) {
            fire.database().ref().child('questions').push()
                .then(response => {
                    console.log('Question Id' + response.key);
                    this.setState({questionId: response.key});
                });
        }
    }

    checkValidity = (name, element) => {
        switch (name) {
            case 'question':
                return this.checkQuestion(element);
            case 'hint':
                return this.checkHint(element);
            case 'explanation':
                return this.checkExplanation(element);
            default:
                return '';
        }
    };

    checkExplanation = (explanation) => {
        if (explanation.value.length === 0 && explanation.focused) {
            return '* Required';
        } else if (explanation.value.length > 300) {
            return 'Cannot be longer than 300 characters';
        } else {
            return '';      // No error
        }
    };

    checkHint = (hint) => {
        if (hint.value.length === 0 && hint.focused) {
            return '* Required';
        } else if (hint.value.length > 100) {
            return 'Cannot be longer than 100 characters';
        } else {
            return '';      // No error
        }
    };

    checkQuestion = (question) => {
        if (question.value.length === 0 && question.focused) {
            return '* Required';
        } else if (question.value.length > 300) {
            return 'Cannot be longer than 300 characters';
        } else {
            return '';      // No error
        }
    };

    checkOptions = (options) => {
        const updatedOptions = {...options};

        let updatedOptionsValid = true;
        const updatedOptionsValue = [];
        for (let option of updatedOptions.value) {
            const updatedOption = {...option};
            updatedOption.error = this.checkOption(updatedOption);
            updatedOptionsValid = updatedOptionsValid && updatedOption.error.length === 0;
            updatedOptionsValue.push(updatedOption);
        }
        updatedOptions.error = this.checkCorrectOption();
        updatedOptionsValid = updatedOptionsValid && updatedOptions.error.length === 0;

        updatedOptions.value = updatedOptionsValue;
        updatedOptions.valid = updatedOptionsValid;

        this.setState({options: updatedOptions})
    };

    checkOption = (option) => {
        if (option.value.length === 0 && option.focused) {
            return '* Required';
        } else if (option.value.length > 15) {
            return 'Cannot be longer than 15 characters';
        } else {
            return '';      // No error
        }
    };

    checkCorrectOption = () => {
        if (this.state.correctOption === null) {
            return 'You must check the correct option';
        } else {
            return '';
        }
    };

    handleClickOpen = () => {
        this.setState({open: true});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    handleChange = event => {
        const updatedOptions = {...this.state.options};
        updatedOptions.error = '';
        this.setState({optionsValue: event.target.value, correctOption: event.target.value, options: updatedOptions});
    };

    handleFieldChange = name => event => {
        const updatedField = {...this.state[name]};
        updatedField.value = event.target.value;
        updatedField.error = this.checkValidity(name, updatedField);
        updatedField.valid = updatedField.error.length === 0;
        this.setState({[name]: updatedField});
    };

    handleOptionChange = index => event => {
        const updatedOptions = {...this.state.options};

        const updatedOption = updatedOptions.value[index];
        updatedOption.value = event.target.value.trim();
        updatedOptions.value[index] = updatedOption;

        this.checkOptions(updatedOptions);
    };

    handleFieldFocus = name => () => {
        const updatedField = {...this.state[name]};
        if (!updatedField.focused) {
            updatedField.focused = true;
            updatedField.error = this.checkValidity(name, updatedField);
            this.setState({[name]: updatedField});
        }
    };

    handleOptionFocus = index => () => {

        const updatedOptions = {...this.state.options};

        const updatedOption = updatedOptions.value[index];
        if (!updatedOption.focused) {
            updatedOption.focused = true;
            updatedOptions.value[index] = updatedOption;
            this.checkOptions(updatedOptions);
        }
    };

    handleSave = (event) => {
        event.preventDefault();
        this.handleClose();
    };

    handleCancel = (event) => {
        event.preventDefault();
        this.handleClose();
    };

    render() {
        const {fullScreen} = this.props;
        return (
            <div>
                <Button
                    onClick={this.handleClickOpen}
                >
                    Add Question
                </Button>
                <Dialog
                    fullScreen={fullScreen}
                    open={this.state.open}
                    onClose={this.handleClose}
                    aria-labelledby="create-question-dialog-title"
                >
                    <DialogTitle id="create-question-dialog-title">Question</DialogTitle>
                    <DialogContent className={classes.root}>
                        <form className={classes.Form}>
                            <TextField
                                label="Question"
                                multiline
                                rowsMax="4"
                                margin="normal"
                                fullWidth
                                error={this.state.question.error.length > 0}
                                helperText={this.state.question.error}
                                value={this.state.question.value}
                                onChange={this.handleFieldChange('question')}
                                onFocus={this.handleFieldFocus('question')}
                            />
                            <Options
                                options={this.state.options}
                                optionChanged={this.handleOptionChange}
                                optionFocused={this.handleOptionFocus}
                                value={this.state.optionsValue}
                                changed={this.handleChange}
                            />
                            <TextField
                                label="Hint"
                                multiline
                                rowsMax="4"
                                margin="normal"
                                fullWidth
                                error={this.state.hint.error.length > 0}
                                helperText={this.state.hint.error}
                                value={this.state.hint.value}
                                onChange={this.handleFieldChange('hint')}
                                onFocus={this.handleFieldFocus('hint')}
                            />
                            <TextField
                                label="Explanation"
                                multiline
                                rowsMax="4"
                                margin="normal"
                                fullWidth
                                error={this.state.explanation.error.length > 0}
                                helperText={this.state.explanation.error}
                                value={this.state.explanation.value}
                                onChange={this.handleFieldChange('explanation')}
                                onFocus={this.handleFieldFocus('explanation')}
                            />
                        </form>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={this.handleCancel}
                            color="primary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={this.handleSave}
                            color="primary" autoFocus
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default withMobileDialog('xs')(CreateQuestionDialog);