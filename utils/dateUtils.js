
// get start of today
async function getStartOfDay (){
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

// get start of the week - Monday
async function getStartOfWeek () {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);

    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}

// get start of month
async function getStartOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

module.exports = {
    getStartOfDay,
    getStartOfWeek,
    getStartOfMonth
}