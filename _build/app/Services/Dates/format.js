function format(date, format = "") {
    date = new Date(date);
    var day = String(date.getDate()).padStart(2, '0');
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var year = date.getFullYear();
    var hour = date.getHours();
    var minute = date.getMinutes();
    let dateReturn;
    if (!date)
        return;
    if (format === 'DD/MM/YYYY')
        dateReturn = `${day}/${month}/${year} ${hour}:${minute}`;
    else
        dateReturn = `${year}${month}${day}${hour}${minute}`;
    return dateReturn;
}
module.exports = { format };
//# sourceMappingURL=format.js.map