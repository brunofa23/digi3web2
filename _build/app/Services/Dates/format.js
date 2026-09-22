"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class format {
    constructor(date) {
        date = new Date(date);
    }
    formatDate(date, format = "") {
        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();
        var hour = String(date.getHours()).padStart(2, '0');
        var minute = String(date.getMinutes()).padStart(2, '0');
        let dateReturn;
        if (!date)
            return "";
        if (format === 'DD/MM/YYYY')
            dateReturn = `${day}/${month}/${year} ${hour}:${minute}`;
        else
            dateReturn = `${year}${month}${day}${hour}${minute}`;
        return dateReturn;
    }
}
exports.default = format;
//# sourceMappingURL=format.js.map