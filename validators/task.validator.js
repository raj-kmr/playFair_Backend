const allowedFrequencies = ["daily", "weekly", "custom"] // Only these values are allowed
const allowedCategories = ["health", "study", "work", "custom"]


function validateCreateTaskBody(body) {
    // Sanitizing the data receive by User
    const title = body.title?.trim();
    const description = body.description?.trim() || null; // make it null if its empty 
    const category = body.category?.trim().toLowerCase() || null;
    const frequency = body.frequency?.trim().toLowerCase() || "daily";
    const targetDays = body.targetDays ?? null; // use null if its undefined or null

    if(!title){
        return {
            error: "Title is required"
        }
    }

    if(title.length < 2 || title.length > 100) {
        return {
            error: "Title must be between 2 and 100 characters"
        }
    }

    if(!allowedFrequencies.includes(frequency)){
        return {
            error: "Invalid frequency"
        }
    }

    if(category && !allowedCategories.includes(category)){
        return {
            error: "Invalid Category"
        }
    }

    if((frequency === "weekly" || frequency === "custom") && targetDays) {
        if(!Array.isArray(targetDays)) {
            return {error: "target Days must be an array"}
        }
    }


    return {
        value: {
            title,
            description,
            category,
            frequency,
            targetDays
        }
    }
}

function validateDailyStatusBody(body) {
    const date = body.date;
    const isCompleted = body.isCompleted;

    if(!date) {
        return {error: "Date is required"} // Date must exist
    }

    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
        return {error: "Date must be in YYYY-MM-DD format"}; // Date must be in format
    }

    // if(isCompleted === "true") isCompleted = true;
    // if(isCompleted === "false") isCompleted = false;

    if(typeof isCompleted !== "boolean"){
        return {error: "isCompleted must be boolean"}
    }

    return {
        value: {
            date,
            isCompleted
        }
    }
}

module.exports = {
    validateCreateTaskBody, 
    validateDailyStatusBody
}