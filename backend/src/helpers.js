export const normalizeEmail = (v)=>{

    if(typeof v !== 'string' ) return '';
    const e =v.trim().toLocaleLowerCase();
    return e.length <= 254 ? e : "";

};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export const bad = (res, message, status = 400) => res.status(status).json({ message });

export const isvaliduser = (v) => typeof v ==='string';
export const isValidPassword = (v) => typeof v === "string" && v.length >= 8 && v.length <= 72; // bcrypt ignores bytes past 72

