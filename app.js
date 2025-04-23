const express = require("express");
const fs = require("fs");
const mysql = require("mysql2");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
require("dotenv").config();

const http = require("http");
// const sharp = require("sharp");
const app = express();
const serv = http.createServer(app);

const cookieParser = require("cookie-parser");
// const { createCanvas, loadImage, registerFont } = require("canvas");
let crypto = false;
let bcrypt = false;
let jwt = false;
let moment = false;
let cookie = false;
const globalPass = process.env.GLOBAL_PASS;
const globalKeys = [process.env.GLOBAL_KEY1, process.env.GLOBAL_KEY2];
const { dbhost, dbuser, dbdatabase, dbpassword } = process.env;
app.set("trust proxy", 1);

const hostDatabase = {
  host: dbhost,
  user: dbuser,
  database: dbdatabase,
  password: dbpassword,
};
// const inputPath = "public/assets/image/image.png";
// const outputPath = "public/assets/image/output.jpg";

// sharp(inputPath)
//   .resize(800) // تغییر سایز
//   .jpeg({ quality: 1 }) // کاهش کیفیت
//   .toFile(outputPath, (err, info) => {
//     if (err) return console.error("خطا در پردازش تصویر:", err);

//     // دریافت سایز فایل خروجی
//     const stats = fs.statSync(outputPath);
//     const fileSizeInMB = stats.size / (1024 * 1024); // تبدیل بایت به مگابایت

//     console.log(`✅ تصویر فشرده شد!`);
//     console.log(`📏 سایز نهایی: ${fileSizeInMB.toFixed(2)} MB`);
//   });

async function addTextToImage(imagePath, outputPath, texts) {
  // بارگذاری تصویر
  const image = await loadImage(imagePath);
  registerFont("public/assets/fonts/VAZIR BOLD.TTF", {
    family: "vazir",
  });
  // ایجاد یک کانواس با ابعاد تصویر
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // رسم تصویر روی کانواس
  ctx.drawImage(image, 0, 0);
  // تنظیمات متن
  ctx.textAlign = "center";

  // اضافه کردن متن‌ها به تصویر
  texts.forEach((text) => {
    ctx.fillStyle = text.color;
    ctx.font = text.fontSize + "px vazir";
    ctx.fillText(text.text, text.x, text.y + text.fontSize);
  });

  // ذخیره تصویر نهایی
  const out = fs.createWriteStream(outputPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  out.on("finish", () => {
    console.log("تصویر با موفقیت ذخیره شد.");
  });
}

// مثال استفاده
const imagePath = "public/assets/image/image.png"; // مسیر تصویر ورودی
// const outputPath = "public/assets/image/output.png"; // مسیر تصویر خروجی
const texts = [
  { text: "متن اول", x: 0, y: 0, color: "#fff", fontSize: 30 },
  { text: "متن دوم", x: 50, y: 30, color: "#fff", fontSize: 30 },
];

// addTextToImage(imagePath, outputPath, texts);
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
  if (!moment) moment = require("moment-jalaali");
  // بررسی فرمت (YYYY/MM/DD)
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateString)) return false;

  // بررسی اینکه moment مقدار را تغییر ندهد
  const date = moment(dateString, "jYYYY/jMM/jDD", true);
  if (!date.isValid()) return false;

  // دریافت مقدار واقعی سال، ماه و روز
  const [year, month, day] = dateString.split("/").map(Number);

  // بررسی اینکه ماه بین 1 تا 12 باشد
  if (month < 1 || month > 12) return false;

  // بررسی تعداد روزهای ماه وارد شده
  const daysInMonth = moment.jDaysInMonth(year, month);
  if (day < 1 || day > daysInMonth) return false;

  return true;
};

const limiter = rateLimit({
  windowMs: 1 * 1000,
  max: 100,
  message: "لطفا چند ثانیه دیگر تلاش کنید.",
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        connectSrc: ["'self'", "ws://projects.miradig.ir"],
      },
    },
  })
);
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

const connection = mysql.createConnection(hostDatabase);
// express
app.use(express.static("public"));
app.use(express.json());

// cookie
app.use(helmet());

app.use(express.urlencoded({ extended: true }));

app.use(limiter);

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "connect-src 'self' ws://localhost:8080"
  );
  next();
});
async function backupDatabaseToSQL({ database, outputFile }) {
  if (!fs) fs = require("fs");
  console.log(1);
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

async function sendEmailWithAttachment(mailOptions) {
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: "maktababadan.ir",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_NAME,
      pass: process.env.EMAIL_PASS,
    },
  });
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error sending email:", error);
    }
    console.log("sended");
    set_data_in_database(
      "INSERT INTO `backup`(`backups`) VALUES (CURRENT_TIMESTAMP)"
    );
  });
  console.log("sending");
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
  console.log(1);
  let last_backup = await (
    await set_data_in_database(
      "SELECT * FROM `backup` ORDER BY id DESC LIMIT 1;"
    )
  )[0];
  if (Math.abs(calculateDaysPassed(last_backup.backups)) < 22)
    return calculateDaysPassed(last_backup.backups);
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
  console.log(1);
  await backupDatabaseToSQL(dbConfig);
  await sendEmailWithAttachment(mailOptions);
  return true;
}

function validateUsernameOrPassword(inputString, isTruePersion = false) {
  let regex = /^[a-zA-Z0-9]+$/;
  if (isTruePersion) {
    regex = /^[a-zA-Z0-9ا-ی]+$/;
  }
  return regex.test(inputString);
}
async function set_data_in_database(
  sqlQuery,
  params = [],
  isRemoveOther = false
) {
  return new Promise((resolve, reject) => {
    connection.query(sqlQuery, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

function createHashkey(payload) {
  if (!jwt) jwt = require("jsonwebtoken");
  if (!crypto) crypto = require("crypto");
  const secretKey = crypto.randomBytes(32).toString("hex");
  const token = jwt.sign(payload, secretKey);
  return { token, secretKey };
}
function verifyToken(token, secretKey) {
  if (!jwt) jwt = require("jsonwebtoken");
  try {
    const decoded = jwt.verify(token, secretKey);
    return true;
  } catch (err) {
    return false;
  }
}

function encryptMessage(message) {
  let keys = [
    "9447a7abdc5113b1eaf4d5cf43a02ddfbdde2d0da7321eb9a3b9305568313dde",
    "7f2e3351f9f085f8f68636f8781b4332",
  ];
  if (!crypto) crypto = require("crypto");
  let encrypted;
  try {
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(globalKeys[0], "hex"),
      Buffer.from(globalKeys[1], "hex")
    );
    encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (e) {
    return { status: false };
  }
}

function decryptMessage(encryptedMessage) {
  if (!crypto) crypto = require("crypto");
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(globalKeys[0], "hex"),
      Buffer.from(globalKeys[1], "hex")
    );
    let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return { status: false };
  }
}

async function comparePassword(password, hash) {
  if (!bcrypt) bcrypt = require("bcrypt");

  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (err) {
    console.error(err);
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
app.delete("*/delete", async (req, res) => {
  const { id } = req.body;
  let user_res;
  if (req.cookies.user) {
    let cookieUser = JSON.parse(req.cookies.user);
    user_res = await (
      await set_data_in_database(
        `SELECT * FROM users WHERE username=?`,
        cookieUser.username
      )
    )[0];
  }
  if (user_res)
    if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
      res.cookie("user", "");
      res.cookie("users", "");
      user_res = "";
    }
  let target_user = await (
    await set_data_in_database(`SELECT id FROM members WHERE id=?`, [id])
  )[0];
  if (!target_user) {
    return res.status(200).json({
      status: false,
      message: "کاربر یافت نشد.",
    });
  }
  let deleteMessage_res = await await set_data_in_database(
    `DELETE FROM members WHERE id=?`,
    [id]
  );
  user_res = await modifyUser(
    encryptMessage(req.body.nationalId),
    user_res.username,
    0
  );
  if (deleteMessage_res.affectedRows > 0 && user_res) {
    res.status(200).json({
      status: true,
    });
  } else {
    res.status(406).json({
      status: false,
      message: "کاربر حذف نشد.",
    });
  }
});

app.post(
  "*/signin",
  [
    body("username")
      .isAlphanumeric()
      .withMessage("نام کاربری باید حروف یا اعداد باشد."),
    body("password").isAlphanumeric().withMessage("Password is not valid"),
  ],
  async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "همه ی فیلد ها را پر کنید" });
    }
    if (
      !validateUsernameOrPassword(username) ||
      !validateUsernameOrPassword(password)
    ) {
      return res.status(406).json({
        message: "فیلد هارو فقط با اعداد و حروف پر کنید.",
      });
    }
    try {
      let user_res = await set_data_in_database(
        `SELECT * FROM users WHERE username=?`,
        [username]
      );
      if (user_res.length === 0) {
        try {
          let result = await comparePassword(password, globalPass);
          if (!result) {
            res.status(406).json({
              message: "پسورد اشتباه است.",
            });
            return;
          }
          const hashedPassword = await hashPassword(password);
          const key = createHashkey({ username: username });
          const sql = `INSERT INTO users(
            username,
            user_key,
            password
                    )
        VALUES(
            ?,
            '${key.secretKey}',
            '${hashedPassword}'
        )`;

          const createColumn = `
        CREATE TABLE ${hostDatabase.database}.??(
    id INT NOT NULL AUTO_INCREMENT,
    memberNationalId TEXT NOT NULL,
    lastModifiedFullDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    isEditOrNew BOOLEAN NOT NULL DEFAULT '1',
    PRIMARY KEY(id)
) ENGINE = InnoDB;
        `;
          result = await set_data_in_database(sql, [username]);
          if (!result) {
            res.status(406).json({
              message: "مشکل در سیستم.",
            });
            return;
          }
          result = await set_data_in_database(createColumn, [
            username + "_members_created",
          ]);
          if (!result) {
            res.status(406).json({
              message: "مشکل در سیستم.",
            });
            return;
          }
          let user = {
            username: username,
            key: key.token,
          };

          res.cookie("user", JSON.stringify(user), {
            expires: new Date("2100-01-01T00:00:00Z"),
            secure: false,
          });
          res.status(201).json({ status: true, message: "خوش آمدید." });
        } catch (e) {
          console.error(e);
          return res.status(406).json({
            message: "مشکل در سیستم.",
          });
        }
        return;
      }
      try {
        let result = await comparePassword(password, user_res[0].password);
        if (!result) {
          res.status(406).json({
            message: "پسورد اشتباه است.",
          });
          return;
        }
        let key = createHashkey({ username: user_res[0].username });
        let isFind = false;
        let user = {
          username: username,
          key: key.token,
          prof_color: user_res[0].prof_color,
        };

        let sql = `
        UPDATE
            users
        SET
            user_key = '${key.secretKey}'
        WHERE
            username = ?
        `;
        let upadte_res = await set_data_in_database(sql, [
          user_res[0].username,
        ]);
        if (upadte_res) {
          res.cookie("user", JSON.stringify(user), {
            expires: new Date("2100-01-01T00:00:00Z"),
            secure: false,
          });
          res.status(201).json({ status: true, message: "دوباره خوش آمدید" });
          return;
        }
        return res.status(406).json({
          message: "مشکل در سیستم.",
        });
      } catch (e) {
        console.error(e);
        return res.status(406).json({
          message: "مشکل در سیستم.",
        });
      }
    } catch (e) {
      console.error(e);
      return res.status(406).json({
        message: "مشکل در سیستم.",
      });
    }
  }
);
let faDate = {
  days: {
    1: "یک",
    2: "دو",
    3: "سه",
    4: "چهار",
    5: "پنج",
    6: "شش",
    7: "هفت",
    8: "هشت",
    9: "نه",
    10: "ده",
    11: "یازده",
    12: "دوازده",
    13: "سیزده",
    14: "چهارده",
    15: "پانزده",
    16: "شانزده",
    17: "هفده",
    18: "هجده",
    19: "نوزده",
    20: "بیست",
    21: "بیست و یک",
    22: "بیست و دو",
    23: "بیست و سه",
    24: "بیست و چهار",
    25: "بیست و پنج",
    26: "بیست و شش",
    27: "بیست و هفت",
    28: "بیست و هشت",
    29: "بیست و نه",
    30: "سی",
    31: "سی و یک",
  },
};
app.post("*/search", [], async (req, res) => {
  if (!cookie) cookie = require("cookie");
  let { textSearch, type } = req.body;

  const cookies = req.headers.cookie;
  let client_cookie = {};
  if (cookies) {
    client_cookie = cookie.parse(cookies);
  }
  if (!req.cookies["user"]) return;
  let user = JSON.parse(req.cookies["user"]);

  let user_res = await (
    await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
      user.username,
    ])
  )[0];

  if (!verifyToken(JSON.parse(client_cookie.user).key, user_res.user_key)) {
    res.cookie("user", "");
    res.status(406).json({
      message: "لطفا دوباره لاگین کنید.",
    });
    return;
  }

  if (user_res) {
    let members_ress;
    let start = 0;
    let plus = 100;
    if (req.body.start) start = req.body.start;
    if (type == "id") {
      members_ress = await set_data_in_database(`SELECT * FROM members`);
    } else if (!textSearch && type !== "lastYearGPA") {
      members_ress = await set_data_in_database(
        `SELECT firstName,lastName,fatherName ,birthDayDate,educationalBase,teacherName,nationalId,number,id FROM members LIMIT ${plus} OFFSET ?
      `,
        [start]
      );
    } else {
      members_ress = await set_data_in_database(
        `SELECT * FROM members LIMIT ${plus} OFFSET ?
      `,
        [start]
      );
    }
    let countOfAll = await set_data_in_database(
      `SELECT COUNT(*) FROM members`,
      []
    );
    if (!members_ress || !countOfAll) {
      res.status(406).json({ status: false });
      return;
    }
    countOfAll = countOfAll[0]["COUNT(*)"];
    let filteredArray = [];
    function searchHand() {
      let base = [
        "firstName",
        "lastName",
        "fatherName",
        "birthDayDate",
        "educationalBase",
        "teacherName",
        "nationalId",
        "number",
      ];
      if (type == "id") {
        members_ress.filter((item) => {
          let object = {};
          if (String(item[type]) == textSearch) {
            object[type] = item[type];
          } else return;
          base.forEach((bas) => {
            if (typeof decryptMessage(item[bas]) !== "string") {
              console.error(item[key], globalKeys);
              console.error(1);
            }
            item[bas] = String(decryptMessage(item[bas]));
            object[bas] = item[bas];
          });
          filteredArray.push(object);
        });
      } else if (!textSearch && type !== "lastYearGPA") {
        filteredArray.push(...members_ress);
        for (let index = 0; index < filteredArray.length; index++) {
          let item = filteredArray[index];
          let keys = Object.keys(item);
          for (let inde = 0; inde < keys.length; inde++) {
            const key = keys[inde];
            if (key !== "id" && item[key] !== null) {
              if (typeof decryptMessage(item[key]) !== "string") {
                console.error(item[key], globalKeys);
                console.error(globalKeys);
                console.error(2);
              }
              item[key] = decryptMessage(item[key]);
            }
          }
        }
      } else {
        switch (true) {
          case type === "birthDayDate":
            if (!moment) moment = require("moment-jalaali");

            moment.loadPersian({
              dialect: "persian-modern",
            });
            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              item[type] = String(decryptMessage(item[type]));
              let now = moment(item[type], "jYYYY/jMM/jDD");

              let dayName = now
                .format("dddd")
                .replace(/\u200C/g, " ")
                .replace(" ", "");
              let month = now
                .format("jMMMM")
                .replace(/\u200C/g, " ")
                .replace(" ", "");

              if (
                String(dayName).includes(textSearch.replace(" ", "")) ||
                String(month).includes(textSearch.replace(" ", "")) ||
                Object.keys(faDate.days).find(
                  (key) =>
                    faDate.days[key] === textSearch && now.format("jD") === key
                )
              ) {
                object[type] = item[type];
              } else continue;
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });
              object["id"] = item["id"];
              filteredArray.push(object);
            }

            break;
          case type === "lastYearGPA":
            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              item[type] = String(decryptMessage(item[type]));
              if (textSearch)
                if (Math.floor(Number(textSearch)) === Math.floor(item[type])) {
                  object[type] = item[type];
                } else continue;
              else {
                object[type] = item[type];
              }
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });
              object["id"] = item["id"];
              filteredArray.push(object);
            }
            filteredArray.sort((a, b) => b[type] - a[type]);

            break;
          case type === "age":
            type = "birthDayDate";
            if (!moment) moment = require("moment-jalaali");
            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              item[type] = String(decryptMessage(item[type]));
              if (textSearch) {
                let arrayOfText = textSearch.split(" ");
                let date = {};
                for (let index = 0; index < arrayOfText.length; index++) {
                  const item = arrayOfText[index];
                  if (item !== "و") {
                    if (Number(item) && !Number(arrayOfText[index + 1])) {
                      if (!date.hasOwnProperty(item))
                        date[arrayOfText[index + 1]] = item;
                    } else if (
                      !Number(item) &&
                      Number(arrayOfText[index + 1])
                    ) {
                      if (!date.hasOwnProperty(item))
                        date[item] = arrayOfText[index + 1];
                    }
                  }
                }
                const birthDate = moment(item[type], "jYYYY/jMM/jDD");
                const today = moment();

                const years = today.diff(birthDate, "years");
                birthDate.add(years, "years");

                const months = today.diff(birthDate, "months");
                birthDate.add(months, "months");
                let days = today.diff(birthDate, "days");
                item["age"] = `${years ? years + "سال  " : ""} ${
                  months ? (years ? " و " : "") + months + " ماه  " : ""
                } ${days > 0 ? (months ? " و " : "") + days + " روز" : ""} `;
                let member = {};
                if (item["age"].trim()) {
                  if (date["سال"]) {
                    if (years === Number(date["سال"])) member = item[type];
                  }
                  if (Number(date["ماه"])) {
                    if (months === Number(date["ماه"])) member = item[type];
                    else member = {};
                  }
                  if (Number(date["روز"])) {
                    if (days === Number(date["روز"])) member = item[type];
                    else member = {};
                  }
                  if (
                    !date["سال"] &&
                    !date["ماه"] &&
                    !date["روز"] &&
                    Number(textSearch)
                  ) {
                    Object.values(date).forEach((val) => {
                      if (
                        Number(val) === Number(years) ||
                        Number(val) === Number(months) ||
                        Number(val) === Number(days)
                      ) {
                        member = item[type];
                      }
                    });
                  }
                  object[type] = member;
                }
                if (Object.keys(member).length === 0) continue;
              } else {
                object[type] = item[type];
              }
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });
              object["id"] = item["id"];
              filteredArray.push(object);
            }
            filteredArray.sort((a, b) => b[type] - a[type]);

            break;
          case type !== "all":
            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              if (typeof decryptMessage(item[type]) !== "string") {
                console.error(item[key], globalKeys);
                console.error(1);
              }
              item[type] = String(decryptMessage(item[type]));
              if (String(item[type]).includes(textSearch)) {
                object[type] = item[type];
              } else continue;
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });

              object["id"] = item["id"];
              filteredArray.push(object);
            }

            break;
          default:
            members_ress.filter((item) => {
              let object = {};
              Object.keys(item).find((key) => {
                if (key !== "id" && item[key] !== null) {
                  if (typeof decryptMessage(item[key]) !== "string") {
                    console.error(item[key], globalKeys);
                    console.error(1);
                  }
                  item[key] = String(decryptMessage(item[key]));
                  if (String(item[key]).includes(textSearch)) {
                    object[key] = item[key];
                  }
                } else if (key === "id") {
                  if (item.id == textSearch) object[key] = item[key];
                }
              });
              if (Object.keys(object).length === 1 && object["id"]) {
                base.forEach((bas) => {
                  item[bas] = String(decryptMessage(item[bas]));
                  object[bas] = item[bas];
                });
                filteredArray.push(object);
              } else if (!object["id"] && Object.keys(object).length > 0) {
                base.forEach((bas) => {
                  if (bas === type) return;
                  object[bas] = item[bas];
                });
                object["id"] = item["id"];
                filteredArray.push(object);
              }
            });
            break;
        }
      }
    }
    searchHand();
    if (filteredArray.length < plus && textSearch && type !== "id") {
      while (countOfAll > start && filteredArray.length < plus) {
        start += plus;
        members_ress = await set_data_in_database(
          `SELECT * FROM members LIMIT ${plus} OFFSET ?
      `,
          [start]
        );
        await searchHand();
      }
      start += plus;
      // start = filteredArray.length;
      let hasStart = {};
      if (plus < start) hasStart = { start: start };
      res.status(200).json({ data: filteredArray, ...hasStart });
    } else {
      res.status(200).json({ data: filteredArray });
    }
  } else res.status(404).json({ message: `کاربر یافت نشد.`, status: false });
});

app.post("*/submitNewMember", [], async (req, res) => {
  if (!moment) moment = require("moment-jalaali");
  if (!cookie) cookie = require("cookie");
  try {
    const cookies = req.headers.cookie;
    let client_cookie = {};
    if (cookies) {
      client_cookie = cookie.parse(cookies);
    }
    if (!req.cookies["user"]) return;
    let user = JSON.parse(req.cookies["user"]);
    let isEmpty = false;
    for (const key in req.body) {
      req.body[key] = String(req.body[key]).trim();
      if (!req.body[key] && req.body[key] != 0) isEmpty = true;
    }
    if (isEmpty || !Number(req.body.number)) {
      return res.status(400).json({ message: "همه ی فیلد ها را پر کنید" });
    }

    let user_res = await (
      await set_data_in_database(
        `SELECT * FROM users WHERE username=?`,
        user.username
      )
    )[0];

    if (!verifyToken(JSON.parse(client_cookie.user).key, user_res.user_key)) {
      res.cookie("user", "");
      res.status(406).json({
        message: "لطفا دوباره لاگین کنید.",
      });
      return;
    }

    if (user_res) {
      const checkExist = await set_data_in_database(
        `SELECT COUNT(*) as count FROM members WHERE nationalId = ?`,
        [encryptMessage(req.body.nationalId)]
      );
      if (checkExist[0].count > 0) {
        res
          .status(404)
          .json({ message: `عضو در سیستم وجود دارد.`, status: false });
        return;
      }
      let keyOfObject = ["editedBy"];
      let isAllow = { status: true, message: "" };
      for (const key in req.body) {
        if (key === "birthDayDate" || key === "dateSchoolSift") {
          if (!isValidJalaliDate(req.body[key])) {
            isAllow = {
              status: false,
              message: `فرمت تاریخ ${
                key === "dateSchoolSift" ? "شیفت" : "تاریخ تولد"
              } نا معتبر است.`,
            };
          } else keyOfObject.push(key);
          if (key === "dateSchoolSift")
            if (moment(req.body[key], "jYYYY/jMM/jDD").weekday() === 5) {
              isAllow = {
                status: false,
                message:
                  "لطفا تاریخ شیفت را از شنبه تا چهارشنبه یا پنجشنبه انتخاب کنید.",
              };
            }
        } else {
          keyOfObject.push(key);
        }
      }
      if (!isAllow.status)
        return res
          .status(406)
          .json({ status: false, message: isAllow.message });

      let member_res = await set_data_in_database(
        `INSERT INTO members(${keyOfObject.join(",")})
VALUES(
 ${keyOfObject
   .map((item, index) => {
     return (item = "?");
   })
   .join(",")}
)
     `,
        keyOfObject.map((item, index) => {
          item = encryptMessage(
            item === "editedBy" ? user_res.username : req.body[item]
          );

          return item;
        })
      );
      if (member_res.affectedRows == 0) {
        res.status(404).json({ message: `مشکل در سیستم.`, status: false });
        return;
      }
      user_res = await modifyUser(
        encryptMessage(req.body.nationalId),
        user_res.username,
        1
      );
      if (!user_res) {
        res.status(404).json({ message: `مشکل در سیستم.`, status: false });
        return;
      }
      res.status(200).json({
        message: "عضو در سیستم ثبت شد.",
        status: true,
      });
    } else res.status(404).json({ message: `کاربر یافت نشد.`, status: false });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server Error");
  }
});

app.post("*/add-property", [], async (req, res, next) => {
  const { englishName, persionName, rowName } = req.body;
  try {
    let user_res;
    if (!englishName || !persionName || !rowName) {
      return res.status(400).json({ message: "همه ی فیلد ها را پر کنید" });
    }

    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }

    const tableName = "members";

    // بررسی می‌کند که آیا ستون در جدول وجود دارد یا نه
    const checkColumn = await set_data_in_database(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [tableName, englishName]
    );
    const checkValue = await set_data_in_database(
      `SELECT COUNT(*) as count FROM columns WHERE value=?`,
      [persionName]
    );
    if (checkColumn[0].count === 0 && checkValue[0].count === 0) {
      let add_res = await set_data_in_database(
        `ALTER TABLE members ADD COLUMN ?? TEXT NOT NULL`,
        [englishName]
      );
      if (!add_res)
        return res.status(406).json({
          message: "مشکل در سیستم.",
        });
      add_res = await set_data_in_database(
        `INSERT INTO
         columns(value) 
         VALUES (?)
         `,
        [JSON.stringify([persionName, englishName, rowName])]
      );

      if (!add_res)
        return res.status(406).json({
          message: "مشکل در سیستم.",
        });
      res.status(200).json({ status: true, message: "ستون اضافه شد." });
    } else {
      res.status(400).json({ status: false, message: "ستون تعریف شده است." });
    }
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});

app.post("*/edit-member/:id", async (req, res) => {
  if (!moment) moment = require("moment-jalaali");
  const memberId = req.params.id;
  try {
    let user_res;
    let cookieUser = {};
    if (req.cookies.user) {
      cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
          cookieUser.username,
        ])
      )[0];
    }
    if (user_res)
      if (!verifyToken(cookieUser.key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }
    let member_res = await (
      await set_data_in_database(
        `SELECT COUNT(*) as count FROM members WHERE id=?`,
        [memberId]
      )
    )[0];
    if (member_res.count === 0) {
      return res.status(404).json({
        status: false,
        message: "کاربر یافت نشد.",
      });
    }
    let values = [];
    let columns = [];
    let isAllow = { status: true, message: "" };

    Object.keys(req.body).forEach((item) => {
      if (!isAllow) return;
      if (item !== "id") {
        if (item === "birthDayDate" || item === "dateSchoolSift") {
          if (!isValidJalaliDate(req.body[item])) {
            isAllow = {
              status: false,
              message: `فرمت تاریخ ${
                item === "dateSchoolSift" ? "شیفت" : "تاریخ تولد"
              } نا معتبر است.`,
            };
          } else {
            let value = req.body[item];
            value = encryptMessage(value);
            columns.push(`${item} = ?`);
            values.push(value);
            if (item === "dateSchoolSift")
              if (moment(req.body[item], "jYYYY/jMM/jDD").weekday() === 5) {
                isAllow = {
                  status: false,
                  message:
                    "لطفا تاریخ شیفت را از شنبه تا چهارشنبه یا پنجشنبه انتخاب کنید.",
                };
                return;
              }
          }
        } else {
          let value = req.body[item];
          value = encryptMessage(value);
          columns.push(`${item} = ?`);
          values.push(value);
        }
      }
    });
    if (!isAllow.status)
      return res.status(406).json({ status: false, message: isAllow.message });

    let query = `UPDATE members SET ${columns.join(", ")}  WHERE id = ?;`;

    let edit_res = await set_data_in_database(query, [...values, memberId]);
    user_res = await modifyUser(
      encryptMessage(req.body.nationalId),
      user_res.username,
      1
    );
    if (edit_res.affectedRows > 0 && user_res)
      res.status(200).json({ status: true });
    else res.status(200).json({ status: false, message: "کاربر ویرایش نشد." });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post("*/getMemebrData", async (req, res) => {
  const { id } = req.body;
  try {
    let user_res;
    let cookieUser = {};
    if (req.cookies.user) {
      cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
          cookieUser.username,
        ])
      )[0];
    }
    if (user_res)
      if (!verifyToken(cookieUser.key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }
    let member_res = await (
      await set_data_in_database(`SELECT * FROM members WHERE id=?`, [id])
    )[0];
    Object.keys(member_res).forEach((item) => {
      if (item !== "id") member_res[item] = decryptMessage(member_res[item]);
    });
    res.status(200).json(member_res);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post("*/getMemebrsData/chart", async (req, res) => {
  try {
    let user_res;
    let cookieUser = {};
    if (req.cookies.user) {
      cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
          cookieUser.username,
        ])
      )[0];
    }
    if (user_res)
      if (!verifyToken(cookieUser.key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }
    let member_res = await set_data_in_database(`SELECT * FROM members `);
    let arrays = {};
    Object.values(member_res).forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (
          key === "educationalBase" ||
          key === "schoolDays" ||
          key === "birthDayDate"
        ) {
          item[key] = decryptMessage(item[key]);
          if (!arrays[key]) arrays[key] = [];
          arrays[key].push(item[key]);
        }
      });
    });
    res.status(200).json(arrays);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.get("*/login", (req, res) => {
  try {
    let path = "login.html";
    const data = fs.readFileSync(path, "utf8");
    res.send(data);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.get("*/search", async (req, res, next) => {
  try {
    let user_res;
    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }

    let path = !user_res ? "pages/login.html" : "pages/search.html";
    const data = fs.readFileSync(path, "utf8");
    res.send(data);
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});

app.get("*/add-property", async (req, res, next) => {
  try {
    let user_res;
    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }

    let path = !user_res ? "pages/login.html" : "pages/add-property.html";
    const data = fs.readFileSync(path, "utf8");
    res.send(data);
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});

app.get("*/member/:id", async (req, res, next) => {
  const userId = req.params.id;
  try {
    let user_res;
    let cookieUser = {};
    if (req.cookies.user) {
      cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
          cookieUser.username,
        ])
      )[0];
    }
    if (user_res)
      if (!verifyToken(cookieUser.key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }
    let member_res = await (
      await set_data_in_database(
        `SELECT COUNT(*) as count FROM members WHERE id=?`,
        [userId]
      )
    )[0];
    let path = !user_res ? "pages/login.html" : "pages/member.html";
    if (member_res.count === 0 && user_res)
      path = "pages/not-found-member.html";
    const data = fs.readFileSync(path, "utf8");
    res.send(data);
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});

app.get("*/columns", async (req, res, next) => {
  try {
    let user_res;
    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }
    let columns_res = await await set_data_in_database(`SELECT * FROM columns`);
    if (columns_res) {
      res.status(200).json({
        status: true,
        columns: columns_res,
      });
    } else {
      res.status(500).json({
        status: false,
      });
    }
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});

app.get("*/report", async (req, res, next) => {
  try {
    let user_res;
    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }

    let path = !user_res ? "pages/login.html" : "pages/report.html";
    const data = fs.readFileSync(path, "utf8");
    res.send(data);
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});
app.get("*/getUpdate", async (req, res, next) => {
  try {
    let user_res;
    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }
    if (user_res) {
      let result = await getBackUp();
      if (typeof result === "boolean")
        res.send(
          "<div style='text-aligh:center;padding:10px;background:green;color:white'>success</div>"
        );
      else
        res.send(
          "<div style='text-aligh:center;padding:10px;background:green;color:white'>faild " +
            result +
            " days</div>"
        );
    } else {
      let path = "pages/login.html";
      const data = fs.readFileSync(path, "utf8");
      res.send(data);
    }
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});
app.get("*", async (req, res, next) => {
  try {
    let user_res;
    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }

    let path = !user_res ? "pages/login.html" : "pages/index.html";
    const data = fs.readFileSync(path, "utf8");
    res.send(data);
  } catch (err) {
    next();
    res.status(500).send("Server Error");
  }
});

const PORT = 3000;
serv.listen(PORT);
