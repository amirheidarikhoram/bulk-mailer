import * as fs from "fs";
import * as csv from "csv-parse";

export async function parseCSV(csvPath: string): Promise<RecipientData[]> {
    return new Promise((resolve, reject) => {
        const records: RecipientData[] = [];
        fs.createReadStream(csvPath)
            .pipe(
                csv.parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                })
            )
            .on("data", (data) => records.push(data))
            .on("error", (error) => reject(error))
            .on("end", () => {
                console.log("✅ CSV parsing completed");
                resolve(records);
            });
    });
}
