import path from "path";
import { __dirname, fs } from "../core/settings.mjs";
import { checkUserAthu, encryptMessage, errorHand } from "../core/utils.mjs";

const upload = async (req, res) => {
  try {
    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

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
