export const validatePassword = (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    
    if (!/(?=.*\d)/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        strength: getPasswordStrength(password)
    };
};

export const getPasswordStrength = (password) => {
    let score = 0;
    
    if (!password) return { score: 0, label: "Very Weak", color: "red" };
    
    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character types
    if (/(?=.*[a-z])/.test(password)) score += 1;
    if (/(?=.*[A-Z])/.test(password)) score += 1;
    if (/(?=.*\d)/.test(password)) score += 1;
    if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) score += 1;
    
    // Patterns
    if (password.length >= 16) score += 1;
    
    const strengthLevels = [
        { score: 0, label: "Very Weak", color: "#ff4444" },
        { score: 1, label: "Very Weak", color: "#ff4444" },
        { score: 2, label: "Weak", color: "#ff8800" },
        { score: 3, label: "Fair", color: "#ffaa00" },
        { score: 4, label: "Good", color: "#88aa00" },
        { score: 5, label: "Strong", color: "#44aa44" },
        { score: 6, label: "Very Strong", color: "#00aa44" },
        { score: 7, label: "Excellent", color: "#008844" }
    ];
    
    return strengthLevels[Math.min(score, 7)];
};

export const isValidEmail = (email) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
};