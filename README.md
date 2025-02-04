# Bulk Email Sender

A simple script for sending bulk emails using templates and CSV data.

## Configuration

Create a `.env` file in the root directory:

```env
MAIL_USER=example@example.com
MAIL_USER_NAME="Example Name"
MAIL_PASS=
MAIL_HOST=sub.example.com
MAIL_IMAP_PORT=993
MAIL_SMTP_PORT=465
```

## Usage

1. Create a template file (JSON):

```json
{
    "subject": "Hello {{name}}",
    "body": "Dear {{name}},\n\nThis is your message.\n\nBest regards"
}
```

2. Prepare CSV file with recipients:

```csv
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
```

3. Build and run the script:

```bash
yarn build && yarn start ./path/to/template.json ./path/to/recipients.csv
```
