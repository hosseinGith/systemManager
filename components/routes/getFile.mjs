import path from "path";
import { __dirname, cookie, fs } from "../core/settings.mjs";
import {
  checkUserAthu,
  decryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";
import sharp from "sharp";

const getFile = async (req, res) => {
  try {
    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

    let lowQuality = String(req.params.fileName.split(".")[0]).includes(
      "_lowQuality"
    );

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
