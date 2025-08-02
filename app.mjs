import { body, express, http, settings } from "./components/core/settings.mjs";
import addProperty from "./components/routes/addProperty.mjs";
import addPropertyPage from "./components/routes/addPropertyPage.mjs";
import addUserBookScore from "./components/routes/addUserBookScore.mjs";
import any_path from "./components/routes/any_path.mjs";
import columns from "./components/routes/columns.mjs";
import editMember from "./components/routes/editMember.mjs";
import getMemebrData from "./components/routes/getMemebrData.mjs";
import getMemebrsData from "./components/routes/getMemebrsData.mjs";
import getScores from "./components/routes/getScores.mjs";
import getUpdate from "./components/routes/getUpdate.mjs";
import login from "./components/routes/login.mjs";
import member from "./components/routes/member.mjs";
import report from "./components/routes/report.mjs";
import search from "./components/routes/search.mjs";
import searchPage from "./components/routes/searchPage.mjs";
import signin from "./components/routes/signin.mjs";
import submitNewMember from "./components/routes/submitNewMember.mjs";
import deleteFun from "./components/routes/delete.mjs";
import getAllScoresMember from "./components/routes/getAllScoresMember.mjs";
import upload from "./components/routes/upload.mjs";
import getFile from "./components/routes/getFile.mjs";
const app = express();
const server = http.createServer(app);

settings(app);

app.delete("*/delete", async (req, res) => deleteFun(req, res));

app.post(
  "*/signin",
  [
    body("username")
      .isAlphanumeric()
      .withMessage("نام کاربری باید حروف یا اعداد باشد."),
    body("password").isAlphanumeric().withMessage("Password is not valid"),
  ],
  async (req, res) => signin(req, res)
);

app.post("*/submitNewMember", [], async (req, res) =>
  submitNewMember(req, res)
);

app.post("*/addUserBookScore/:id", async (req, res) =>
  addUserBookScore(req, res)
);

app.post("*/upload", async (req, res) => upload(req, res));

app.put("*/add-property", [], async (req, res) => addProperty(req, res));

app.patch("*/edit-member/:id", async (req, res) => editMember(req, res));

app.get("*/getMemebrsData/chart", async (req, res) => getMemebrsData(req, res));

app.get("*/getMemebrData", async (req, res) => getMemebrData(req, res));

app.get("*/getScores/:id", async (req, res) => getScores(req, res));
app.get("*/getAllScoresMember/:id", async (req, res) =>
  getAllScoresMember(req, res)
);
app.get("*/getDataSearch", [], async (req, res) => search(req, res));

app.get("*/getFile/:fileName", async (req, res) => getFile(req, res));

app.get("*/search", async (req, res, next) => searchPage(req, res, next));

app.get("*/add-property", async (req, res, next) =>
  addPropertyPage(req, res, next)
);

app.get("*/member/:id", async (req, res, next) => member(req, res, next));

app.get("*/columns", async (req, res, next) => columns(req, res, next));

app.get("*/report", async (req, res, next) => report(req, res, next));
app.get("*/getUpdate", async (req, res, next) => getUpdate(req, res, next));
app.get("*", async (req, res, next) => any_path(req, res, next));

const PORT = 3001;
server.listen(PORT);
