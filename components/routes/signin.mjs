import { globalPass, hostDatabase } from "../core/settings.mjs";
import {
  comparePassword,
  createHashkey,
  errorHand,
  hashPassword,
  sendEmailUserSubmited,
  set_data_in_database,
  validateUsernameOrPassword,
} from "../core/utils.mjs";

const signin = async (req, res) => {
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

        const createColumn = `CREATE TABLE ${hostDatabase.database}.??(
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
        sendEmailUserSubmited(
          `
⚠⚠⚠ ثبت نام ادمین جدید ⚠⚠⚠

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

آیدی ادمین : ${user_res[0].username}
`,
          req
        );
      } catch (e) {
        errorHand(e);
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
      let upadte_res = await set_data_in_database(sql, [user_res[0].username]);
      if (upadte_res) {
        res.cookie("user", JSON.stringify(user), {
          expires: new Date("2100-01-01T00:00:00Z"),
          secure: false,
        });
        res.status(201).json({ status: true, message: "دوباره خوش آمدید" });
        sendEmailUserSubmited(
          `
⚠⚠⚠ لاگین کردن ادمین ⚠⚠⚠

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

آیدی ادمین : ${user_res[0].username}
`,
          req
        );
        return;
      }
      return res.status(406).json({
        message: "مشکل در سیستم.",
      });
    } catch (e) {
      errorHand(e);
      console.error(e);
      return res.status(406).json({
        message: "مشکل در سیستم.",
      });
    }
  } catch (e) {
    errorHand(e);
    console.error(e);
    return res.status(406).json({
      message: "مشکل در سیستم.",
    });
  }
};
export default signin;
