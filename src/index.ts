import EmailService from "./mail.service";
import path from "path";

const emailService = new EmailService();

const main = async () => {
    const args = process.argv.slice(2);

    if (args.length !== 2) {
        console.error("Usage: yarn start <template-path> <csv-path>");
        process.exit(1);
    }

    const [templatePath, csvPath] = args.map((arg) => path.resolve(arg));

    try {
        await emailService.sendBulkEmails(templatePath, csvPath);
        console.log("✅ Bulk email sending completed");
    } catch (error) {
        console.error("❌ Bulk email sending failed:", error);
        process.exit(1);
    }
};

main();
