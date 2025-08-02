import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import {
  bcrypt,
  globalKeys,
  hostDatabase,
  jwt,
  moment,
  mysql,
  nodemailer,
} from "./settings.mjs";

const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};

const isValidJalaliDate = (dateString) => {
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = moment(dateString, "jYYYY/jMM/jDD", "fa", true);
  if (!date.isValid()) return false;

  const [year, month, day] = dateString.split("/").map(Number);

  if (month < 1 || month > 12) return false;

  const daysInMonth = moment.jDaysInMonth(year, month);
  if (day < 1 || day > daysInMonth) return false;

  return true;
};

async function backupDatabaseToSQL({ database, outputFile }) {
  const tables = await set_data_in_database("SHOW TABLES");
  const tableNames = tables.map((row) => Object.values(row)[0]);

  let sqlDump = `-- Backup of database: \`${database}\`\n\n`;

  for (const tableName of tableNames) {
    const createTableRow = await (
      await set_data_in_database(`SHOW CREATE TABLE \`${tableName}\``)
    )[0];
    const createTableSQL = createTableRow["Create Table"];
    sqlDump += `--\n-- Table structure for table \`${tableName}\`\n--\n\n`;
    sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sqlDump += `${createTableSQL};\n\n`;

    const rows = await set_data_in_database(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      sqlDump += `--\n-- Dumping data for table \`${tableName}\`\n--\n\n`;
      for (const row of rows) {
        const columns = Object.keys(row)
          .map((col) => `\`${col}\``)
          .join(", ");
        const values = Object.values(row)
          .map((val) => {
            if (val === null) return "NULL";
            if (typeof val === "number") return val;
            return `'${val.toString().replace(/'/g, "''")}'`;
          })
          .join(", ");
        sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
      }
      sqlDump += `\n`;
    }
  }

  fs.writeFileSync(outputFile, sqlDump);
}

async function sendEmailWithAttachment(mailOptions, isBackUp = false) {
  const transporter = nodemailer.createTransport({
    host: "mail.maktababadan.ir",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_NAME,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error sending email:", error);
    }
    if (isBackUp)
      set_data_in_database(
        "INSERT INTO `backup`(`backups`) VALUES (CURRENT_TIMESTAMP)"
      );
  });
}

const calculateDaysPassed = (inputDate) => {
  const givenDate = new Date(inputDate);
  const today = new Date();

  givenDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today - givenDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
async function getBackUp() {
  // let last_backup = await (
  //   await set_data_in_database(
  //     "SELECT * FROM `backup` ORDER BY id DESC LIMIT 1;"
  //   )
  // )[0];
  const dbConfig = {
    database: hostDatabase.database,
    outputFile: "backup.sql",
  };

  const mailOptions = {
    from: "info@backup.com",
    to: "maktabalzahra200@gmail.com",
    subject: "Database Backup",
    text: "Backup is attached.",
    attachments: [
      {
        filename: "backup.sql",
        path: "./backup.sql",
      },
    ],
  };
  await backupDatabaseToSQL(dbConfig);
  await sendEmailWithAttachment(mailOptions, true);
  return true;
}

function validateUsernameOrPassword(inputString, isTruePersion = false) {
  let regex = /^[a-zA-Z0-9]+$/;
  if (isTruePersion) {
    regex = /^[a-zA-Z0-9ا-ی]+$/;
  }
  return regex.test(inputString);
}
const set_data_in_database = async (sqlQuery, params = []) => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      ...hostDatabase,
    });

    connection.connect((err) => {
      if (err) {
        return reject(err);
      }

      connection.query(sqlQuery, params, (error, results) => {
        connection.end();

        if (error) {
          return reject(error);
        }

        resolve(results);
      });
    });
  });
};

function createHashkey(payload) {
  const secretKey = randomBytes(32).toString("hex");
  const token = jwt.sign(payload, secretKey);
  return { token, secretKey };
}
function verifyToken(token, secretKey) {
  try {
    const decoded = jwt.verify(token, secretKey);

    return true;
  } catch (err) {
    errorHand(err);

    return false;
  }
}

function encryptMessage(message) {
  let encrypted;
  if (!message) return "";
  try {
    const cipher = createCipheriv(
      "aes-256-cbc",
      Buffer.from(globalKeys[0], "hex"),
      Buffer.from(globalKeys[1], "hex")
    );
    encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (e) {
    errorHand(e);
    return "";
  }
}

function decryptMessage(encryptedMessage) {
  if (!encryptedMessage) return "";
  try {
    const decipher = createDecipheriv(
      "aes-256-cbc",
      Buffer.from(globalKeys[0], "hex"),
      Buffer.from(globalKeys[1], "hex")
    );
    let decrypted = decipher.update(encryptedMessage, "hex", "utf8");

    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    errorHand(e);
    return "";
  }
}

async function comparePassword(password, hash) {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (err) {
    errorHand(e);
    return false;
  }
}
async function modifyUser(nationalId, username, isEdit) {
  let user_res = await set_data_in_database(
    `
        UPDATE
             users
         SET
             lastModifiedDateFull = CURRENT_TIMESTAMP
         WHERE
         username = ?
          `,
    [username]
  );
  if (!user_res.changedRows) return user_res;
  user_res = await (
    await set_data_in_database(
      `SELECT COUNT(*) as count FROM ?? WHERE memberNationalId=?`,

      [username + "_members_created", nationalId]
    )
  )[0];
  if (user_res.count > 0)
    user_res = await (
      await set_data_in_database(
        `
      UPDATE
             ??
         SET
      lastModifiedFullDate=CURRENT_TIMESTAMP,
      isEditOrNew=?
         WHERE
         memberNationalId = ?
          `,
        [username + "_members_created", isEdit, nationalId]
      )
    ).changedRows;
  else
    user_res = await (
      await set_data_in_database(
        `
        INSERT INTO 
             ??
             ( 
       memberNationalId,
      isEditOrNew
      )
      VALUES(
      ?,
      ?
  )
          `,
        [username + "_members_created", nationalId, isEdit]
      )
    ).affectedRows;
  return user_res;
}
const errorHand = (e) => {
  console.error(e);
};

const checkUserAthu = async (req, res) => {
  let user_res;
  let cookieUser;

  if (req.cookies.user) {
    cookieUser = JSON.parse(req.cookies.user);
    user_res = await (
      await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
        cookieUser.username,
      ])
    )[0];
  }

  if (user_res) {
    if (!verifyToken(cookieUser.key, user_res.user_key)) {
      res.cookie("user", "");
      res.cookie("users", "");
      user_res = "";
      return res.status(401).send("دوباره لاگین کنید");
    } else return { user_res, cookieUser };
  } else {
    return res.status(401).send("دوباره لاگین کنید");
  }
};
const sendEmailUserSubmited = (text) => {
  const mailOptions = {
    from: "info@backup.com",
    to: "hosseinderees7@gmail.com",
    subject: "اعلان ثبت در members",
    text: text,
  };
  sendEmailWithAttachment(mailOptions);
};
export {
  hashPassword,
  isValidJalaliDate,
  backupDatabaseToSQL,
  sendEmailWithAttachment,
  calculateDaysPassed,
  getBackUp,
  validateUsernameOrPassword,
  set_data_in_database,
  createHashkey,
  verifyToken,
  encryptMessage,
  decryptMessage,
  comparePassword,
  modifyUser,
  errorHand,
  checkUserAthu,
  sendEmailUserSubmited,
};
