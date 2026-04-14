const { error } = require("node:console");
const { createReminder, getReminders, updateReminder, deleteReminders } = require("../services/reminders.service")
const {validateCreateReminder, validateUpdateReminder} = require("../validators/reminders.validator")

async function creatingReminder(req, res){
    try {
        const validationError = await validateCreateReminder(req.body);
        if(validationError) {
            console.log("Validation error:", validationError);
            console.log("Request body:", req.body);
            return res.status(400).json({error: validationError});
        }

        const reminder = await createReminder({
            userId: req.user.id,
            gamesId: req.body.gamesId,
            reminderType: req.body.reminderType,
            reminderValue: req.body.reminderValue,
            scheduledTime: req.body.scheduledTime,
            scheduledDays: req.body.scheduledDays
        });

        res.status(201).json(reminder);
    } catch(err){
        console.error("Create reminder error:", err);
        res.status(500).json({error: err.message || String(err)})
    }
}

async function gettingReminders(req, res){
    try {
        const reminders = await getReminders(req.user.id);
        res.json(reminders)
    } catch(err){
        res.status(500).json({error: err.message})
    }
}

async function updatingReminder(req, res){
    try {
        const {error, updates} = validateUpdateReminder(req.body);
        if(error) return res.status(400).json({error})

        const reminder = await updateReminder({
            id: req.params.id,
            userId: req.user.id,
            updates
        })

        if(!reminder){
            return res.status(404).json({error: "Reminder not found"})
        }

        res.json(reminder)
    } catch(err){
        res.status(500).json({error: err.message})
    }
}

async function deletingReminder(req, res){
    try{
        const reminder = await deleteReminders(
            req.params.id,
            req.user.id
        )

        if(!reminder){
            return res.status(404).json({error: "Reminder not found"})
        }

        res.json({message: "Reminder deleted"})
    } catch(err){
        res.status(500).json({error: err.message})
    }
}

module.exports  = {
    creatingReminder,
    gettingReminders,
    updatingReminder,
    deletingReminder
}