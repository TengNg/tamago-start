import bcrypt from 'bcryptjs';

async function execute() {
    try {
        const password = "abcd1234";
        const hashedPwd = await bcrypt.hash(password, 10);
        console.log(hashedPwd);
    } catch (error) {
        console.error("Error generating hashed password: ", error);
    }
};

execute();
