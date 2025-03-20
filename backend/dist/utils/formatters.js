"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPhone = exports.formatFileSize = exports.formatPercentage = exports.formatNumber = exports.formatCurrency = exports.formatDateWithLabel = exports.formatRelativeTime = exports.formatDateSafely = void 0;
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
const formatDateSafely = (date, formatString, defaultValue = 'Unbekannt') => {
    try {
        if (!date)
            return defaultValue;
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.error(`Invalid date format: ${date} with format: ${formatString}`);
            return defaultValue;
        }
        return (0, date_fns_1.format)(parsedDate, formatString, { locale: locale_1.de });
    }
    catch (error) {
        console.error('Error formatting date:', error);
        return defaultValue;
    }
};
exports.formatDateSafely = formatDateSafely;
const formatRelativeTime = (date, options = {}) => {
    try {
        if (!date)
            return 'Unbekannt';
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            console.error(`Invalid date provided to formatRelativeTime: ${date}`);
            return 'Ungültiges Datum';
        }
        return (0, date_fns_1.formatDistanceToNow)(parsedDate, {
            addSuffix: true,
            locale: locale_1.de,
            ...options
        });
    }
    catch (error) {
        console.error('Error formatting relative time:', error);
        return 'Unbekannt';
    }
};
exports.formatRelativeTime = formatRelativeTime;
const formatDateWithLabel = (date) => {
    try {
        if (!date)
            return { label: 'Unbekannt', class: 'secondary' };
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return { label: 'Ungültiges Datum', class: 'danger' };
        }
        if ((0, date_fns_1.isToday)(parsedDate)) {
            return {
                label: 'Heute',
                fullDate: (0, date_fns_1.format)(parsedDate, 'dd.MM.yyyy'),
                class: 'primary'
            };
        }
        if ((0, date_fns_1.isTomorrow)(parsedDate)) {
            return {
                label: 'Morgen',
                fullDate: (0, date_fns_1.format)(parsedDate, 'dd.MM.yyyy'),
                class: 'success'
            };
        }
        if ((0, date_fns_1.isYesterday)(parsedDate)) {
            return {
                label: 'Gestern',
                fullDate: (0, date_fns_1.format)(parsedDate, 'dd.MM.yyyy'),
                class: 'warning'
            };
        }
        return {
            label: (0, date_fns_1.format)(parsedDate, 'dd.MM.yyyy'),
            fullDate: (0, date_fns_1.format)(parsedDate, 'dd.MM.yyyy'),
            class: 'secondary'
        };
    }
    catch (error) {
        console.error('Error formatting date with label:', error);
        return { label: 'Unbekannt', class: 'secondary' };
    }
};
exports.formatDateWithLabel = formatDateWithLabel;
const formatCurrency = (amount, currency = 'EUR') => {
    try {
        if (amount === null || amount === undefined)
            return '-';
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency
        }).format(amount);
    }
    catch (error) {
        console.error('Error formatting currency:', error);
        return '-';
    }
};
exports.formatCurrency = formatCurrency;
const formatNumber = (number, decimals = 2) => {
    try {
        if (number === null || number === undefined)
            return '-';
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }
    catch (error) {
        console.error('Error formatting number:', error);
        return '-';
    }
};
exports.formatNumber = formatNumber;
const formatPercentage = (value, decimals = 1) => {
    try {
        if (value === null || value === undefined)
            return '-';
        return new Intl.NumberFormat('de-DE', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value / 100);
    }
    catch (error) {
        console.error('Error formatting percentage:', error);
        return '-';
    }
};
exports.formatPercentage = formatPercentage;
const formatFileSize = (bytes) => {
    try {
        if (bytes === null || bytes === undefined)
            return '-';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const formattedSize = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
        return `${formattedSize} ${sizes[i]}`;
    }
    catch (error) {
        console.error('Error formatting file size:', error);
        return '-';
    }
};
exports.formatFileSize = formatFileSize;
const formatPhone = (number) => {
    try {
        if (!number)
            return '-';
        const digits = number.replace(/\D/g, '');
        if (digits.length <= 4) {
            return digits;
        }
        else if (digits.length <= 7) {
            return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        }
        else if (digits.length <= 10) {
            return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
        else {
            return digits.replace(/(\d{3})(\d{3})(\d{2})(\d+)/, '$1 $2 $3 $4');
        }
    }
    catch (error) {
        console.error('Error formatting phone number:', error);
        return number || '-';
    }
};
exports.formatPhone = formatPhone;
//# sourceMappingURL=formatters.js.map