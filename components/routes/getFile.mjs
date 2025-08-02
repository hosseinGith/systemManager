import path from "path";
import { __dirname, cookie, fs } from "../core/settings.mjs";
import {
  decryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";
import sharp from "sharp";

const getFile = async (req, res) => {
  try {
    let lowQuality = String(req.params.fileName.split(".")[0]).includes(
      "_lowQuality"
    );
    const cookies = req.headers.cookie;
    let client_cookie = {};
    if (cookies) {
      client_cookie = cookie.parse(cookies);
    }
    if (!req.cookies["user"]) return;
    let user = JSON.parse(req.cookies["user"]);

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

    let decoded_url =
      decryptMessage(
        req.params.fileName.split(".")[0].replace("_lowQuality", ""),
        [process.env.images_key1, process.env.images_key2]
      ) +
      "." +
      req.params.fileName.split(".")[1];

    let filePath = path.join(__dirname, process.env.fileDir, decoded_url);

    if (fs.existsSync(filePath)) {
      if (lowQuality) {
        res.send(
          await sharp(filePath)
            .jpeg({
              quality: 1,
              chromaSubsampling: "4:4:4",
            })
            .toBuffer()
        );
      } else res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "فایل پیدا نشد" });
    }
    user_res = null;
    filePath = null;
  } catch (e) {
    errorHand(e);
    res.status(500).json({ error: "مشکل در سیستم" });
  }
};
export default getFile;
