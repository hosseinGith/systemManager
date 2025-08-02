import {
  checkUserAthu,
  errorHand,
  sendEmailUserSubmited,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const addProperty = async (req, res) => {
  const { englishName, persionName, rowName } = req.body;
  try {
    if (!englishName || !persionName || !rowName) {
      return res.status(400).json({ message: "همه ی فیلد ها را پر کنید" });
    }

    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

    const tableName = "members";

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
      sendEmailUserSubmited(
        `
پارامتر 📦

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

پارامتر جدید در صفحه اصلی اضافه شد`
      );
      res.status(200).json({ status: true, message: "ستون اضافه شد." });
    } else {
      res.status(400).json({ status: false, message: "ستون تعریف شده است." });
    }
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default addProperty;
