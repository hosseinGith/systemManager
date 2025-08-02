import path from "path";
import { __dirname, cookie, fs } from "../core/settings.mjs";
import {
  encryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const upload = async (req, res) => {
  try {
    const cookies = req.headers.cookie;
    let client_cookie = {};
    if (cookies) {
      client_cookie = cookie.parse(cookies);
    }
    if (!req.cookies["user"])
      return res.status(401).json({
        message: "لطفا دوباره لاگین کنید.",
      });
    let user = JSON.parse(req.cookies["user"]);

    let user_res = await (
      await set_data_in_database(
        `SELECT * FROM users WHERE username=?`,
        user.username
      )
    )[0];

    if (!verifyToken(JSON.parse(client_cookie.user).key, user_res.user_key)) {
      res.cookie("user", "");
      res.status(401).json({
        message: "لطفا دوباره لاگین کنید.",
      });
      return;
    }
    const { ext } = req.headers;
    if (ext && user_res) {
      let decoded_url = `member-time(${Date.now()})-randText(${Date.now().toString(
        32
      )})_file_ext`;

      const eecoded_url =
        encryptMessage(decoded_url, [
          process.env.images_key1,
          process.env.images_key2,
        ]) + `.${ext}`;

      decoded_url += `.${ext}`;

      const filePath = path.join(__dirname, process.env.fileDir, decoded_url);

      let totalSize = 0;
      req.on("data", (chunk) => {
        totalSize += chunk.length;
      });

      try {
        let result = await new Promise((resolve, reject) => {
          let writeStream = fs.createWriteStream(filePath);

          req.on("error", (err) => {
            writeStream.destroy();
            reject(err);
          });
          writeStream.on("finish", () => {
            resolve(true);
          });
          writeStream.on("error", (e) => {
            reject(e);
            writeStream = null;
          });
          req.on("error", (e) => {
            reject(e);
            writeStream = null;
          });
          req.pipe(writeStream);
        });

        if (!result) {
          errorHand(result);
          res
            .status(500)
            .json({ message: "خطا در پردازش فایل", error: result });
          result = null;
          return;
        }

        res.status(200).json({
          message: "فایل با موفقیت آپلود شد.",
          url: `/getFile/${eecoded_url}`,
        });
      } catch (e) {
        errorHand(e);
        res.status(500).json({ message: "خطا در پردازش فایل", error: e });
      } finally {
        decoded_url = null;
        totalSize = null;
      }
    } else
      res.status(400).json({
        status: false,
        message: "مقادیر را پر کنید.",
      });
    user = null;
  } catch (e) {
    errorHand(e);
    res.status(500).json({ error: "مشکل در سیستم" });
  }
};
export default upload;
