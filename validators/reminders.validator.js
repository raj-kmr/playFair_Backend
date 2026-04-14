const allowedTypes = ["session_limit",  "daily_limit", "break_reminder", "game_time"]

async function validateCreateReminder(body) {
    
    const reminderType = body.reminderType?.trim();
    const reminderValue = Number(body.reminderValue);
    const gamesId = body.gamesId || null;
    const scheduledTime = body.scheduledTime || null;
    const scheduledDays = body.scheduledDays || null;

    if(!allowedTypes.includes(reminderType)){
        return "Invalid reminder type"
    }

    if(!reminderValue || reminderValue <= 0){
        return "Reminder value must be a positive number"
    }

    if(reminderType === "game_time" && !scheduledTime){
        return "Game time reminder requires a scheduled time"
    }

    return null;
}

async function validateUpdateReminder(body){
    const updates = {}

    if(body.reminderType){
        if(!allowedTypes.includes(body.reminderType)){
            return {error: "Invalid reminder type"}
        }
        updates.reminder_type = body.reminderType;
    }

    if(body.reminderValue){
        if(body.reminderValue <= 0){
            return {error: "Invalid reminder value"}
        }
        updates.reminder_value = body.reminderValue;
    }

    if(body.isActive !== undefined){
        updates.is_active = body.isActive;
    }

    return {updates};
}

module.exports = {
    validateCreateReminder,
    validateUpdateReminder
}