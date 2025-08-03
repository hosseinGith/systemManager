const form = document.querySelector("form");
const loading = document.querySelector(".loading");
const allFormInputs = form.querySelectorAll(
  "input:not([type='hidden']),select:not([type='hidden']),textarea:not([type='hidden'])"
);
let server_image_url = "";
Chart.register(ChartZoom);

const match = window.location.pathname.match(/\/member\/(\d+)/);
const userId = match ? Number(match[1]) : null;
let scoreChart;
let columns;
let memebr;

(async () => {
  columns = await (await fetch("/columns")).json();
  columns = columns.columns;
  columns?.forEach((item) => {
    if (typeof item.value === "string") item.value = JSON.parse(item.value);
  });
  let datas_query = convertToQuery({ id: userId });

  memebr = await (await fetch("/getMemebrData?" + datas_query)).json();

  Object.keys(memebr)?.forEach((key) => {
    if (document.querySelector(`[name="${key}"]`))
      document.querySelector(`[name="${key}"]`).value = memebr[key];
  });
  if (!String(memebr.schoolSift).includes("ثابت")) {
    document.querySelector("[name='dateSchoolSift']").type = "text";
  } else {
    document.querySelector("[name='dateSchoolSift']").type = "hidden";
  }
  if (memebr.schoolSift === "صبح" || memebr.schoolSift === "عصر") {
    generateWeeks(memebr.dateSchoolSift, memebr.schoolSift === "صبح");
    document.querySelector("#shiftCont").style.display = "";
  } else {
    document.querySelector("#shiftCont").style.display = "none";
  }
  document.querySelector("#titleOfthePage").textContent =
    "کاربر: " + memebr.firstName + " " + memebr.lastName;

  $(".educationalBaseAddScore").val(memebr.educationalBase);
  await userEducationalBaseChangeHand(`addScoreForm`);
  await userEducationalBaseChangeHand(`showChartForm`);
  if (!memebr.member_image_url) return;
  $("#uploadPersonContainer").addClass("hidden");
  $("#uploadedUserImage").removeClass("hidden");
  server_image_url = memebr.member_image_url;
  member_image_url = server_image_url;
  $("#uploadedUserImage")[0].src = memebr.member_image_url;
})();
function input(target) {
  if (target) {
    if (target.value !== memebr[target.name]) {
      target.style.borderColor = "red";
    } else target.style.borderColor = "";
  }
}

Array.from(allFormInputs).forEach((element) => {
  if (!element.options)
    element.addEventListener("input", function () {
      input(this);
    });
  else
    element.addEventListener("change", function () {
      input(this);
    });
});

function formData(memebr) {
  let value = {};
  Object.keys(memebr).forEach((key) => {
    let target = document.querySelector(`[name="${key}"]:not([type="hidden"])`);
    if (target)
      if (target.value !== memebr[key] && target.name === "birthDayDate") {
        if (!isValidJalaliDate(target.value)) {
          Swal.fire({
            icon: "error",
            text: "فرمت تاریخ نا معتبر است..",
            confirmButtonText: "تایید",
            customClass: {
              confirmButton: "button",
            },
          });
          value = false;
        } else value[target.name] = target.value;
      } else if (value && target.value !== memebr[key])
        value[key] = target.value;
  });
  if (Object.keys(value).length > 0)
    value["nationalId"] = document.querySelector('[name="nationalId"]').value;
  return value;
}

async function submitForm(e) {
  e.preventDefault();
  loading.classList.remove("opacity-0");
  loading.classList.remove("pointer-events-none");
  let body = formData(memebr);
  if (!body) {
    loading.classList.add("opacity-0");
    loading.classList.add("pointer-events-none");
    return;
  }

  if (
    Object.values(body).length === 0 &&
    member_image_url === server_image_url
  ) {
    Swal.fire({
      icon: "error",
      text: "فیلد های کاربر ویرایش نشده است.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  } else
    try {
      body["member_image_url"] = member_image_url;
      server_image_url = member_image_url;
      let res = await (
        await fetch("/edit-member/" + userId, {
          method: "PATCH",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(body),
        })
      ).json();

      if (res.status) {
        Array.from(allFormInputs).forEach((element) => {
          element.style.borderColor = "";
        });
        Swal.fire({
          icon: "success",
          text: "کاربر ویرایش شد.",
          confirmButtonText: "تایید",
          customClass: {
            confirmButton: "button",
          },
        });
        $(
          "#uploadedUserImage"
        )[0].parentElement.parentElement.style.borderColor = "black";
        document.querySelector("#titleOfthePage").textContent =
          "کاربر: " +
          document.querySelector('[name="firstName"]').value +
          " " +
          document.querySelector('[name="lastName"]').value;
        let datas_query = convertToQuery({ id: userId });

        memebr = await (await fetch("/getMemebrData?" + datas_query)).json();
        if (memebr.schoolSift === "صبح" || memebr.schoolSift === "عصر") {
          generateWeeks(memebr.dateSchoolSift, memebr.schoolSift === "صبح");
          document.querySelector("#shiftCont").style.display = "";
        } else {
          document.querySelector("#shiftCont").style.display = "none";
        }
      } else
        Swal.fire({
          icon: "error",
          text: res.message,
          confirmButtonText: "تایید",
          customClass: {
            confirmButton: "button",
          },
        });
    } catch (e) {
      Swal.fire({
        icon: "error",
        text: "مشکل در سیستم.",
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
      console.error(e);
    }

  loading.classList.add("opacity-0");
  loading.classList.add("pointer-events-none");
}

let addUs_birthday = document.querySelector(".birthDayDate");
jalaliDatepicker.startWatch({
  dayRendering: function (dayOptions, addUs_birthday) {
    return {
      isHollyDay: dayOptions.month == 1 && dayOptions.day <= 4,
    };
  },
});
document.querySelector("[name='schoolSift']").onchange = function () {
  if (!String(this.value).includes("ثابت")) {
    document.querySelector("[name='dateSchoolSift']").type = "text";
  } else {
    document.querySelector("[name='dateSchoolSift']").type = "hidden";
  }
};
moment.locale("fa");
function isMorningWeek(startWeek, checkWeek, startMorning = true) {
  let weekDiff = checkWeek - startWeek;
  return weekDiff % 2 === 0 ? startMorning : !startMorning;
}

function getShamsiWeek(dateString) {
  let date = moment(dateString, "jYYYY-jMM-jDD");
  return date.jWeek(); // شماره هفته شمسی
}

function generateWeeks(dateInput, isMorning = true) {
  let inputDate = moment(dateInput, "jYYYY/jMM/jDD");
  let year = inputDate.jYear(); // سال شمسی را دریافت می‌کنیم

  // شروع و پایان سال تحصیلی را داینامیک تعیین می‌کنیم
  let startYear = moment(`${year}/07/01`, "jYYYY-jMM-jDD")
    .clone()
    .startOf("week"); // ۱ مهر همان سال
  dateInput = moment(dateInput, "jYYYY-jMM-jDD")
    .clone()
    .startOf("week")
    .format("jYYYY-jMM-jDD");
  let startDate = moment(dateInput, "jYYYY-jMM-jDD"); // ۱ مهر همان سال
  let endDate = moment(`${year + 1}-04-01`, "jYYYY-jMM-jDD")
    .clone()
    .startOf("week"); // ۱ تیر سال بعد
  endDate = endDate.clone().endOf("week");

  let selectedWeek = getShamsiWeek(dateInput);
  let tableBody = document.getElementById("weeksTable");
  tableBody.innerHTML = ""; // پاک کردن جدول قبلی

  let currentDate = moment(startYear);
  while (currentDate.isBefore(startDate)) {
    if (currentDate.jWeek() === selectedWeek) {
      currentDate.add(1, "weeks"); // هفته بعد برو
      continue;
    }
    let weekNum = getShamsiWeek(currentDate.format("jYYYY-jMM-jDD"));
    let isThisWeekMorning = isMorningWeek(selectedWeek, weekNum, isMorning);

    let row = `<tr class="slowMotionAnimateClose ${
      isThisWeekMorning ? "morning" : "evening"
    }">
                    <td class='dateShift '>از ${currentDate.format(
                      "jYYYY/jMM/jDD"
                    )} تا ${currentDate
      .clone()
      .endOf("week")
      .format("jYYYY/jMM/jDD")}</td>
                      <td>${isThisWeekMorning ? "🌞 صبح" : "🌙 عصر"}</td>
                     </tr>`;
    tableBody.innerHTML += row;

    currentDate.add(1, "weeks"); // رفتن به هفته‌ی بعد
  }
  currentDate = moment(startDate);
  while (currentDate.isBefore(endDate)) {
    let weekNum = getShamsiWeek(currentDate.format("jYYYY-jMM-jDD"));
    let isThisWeekMorning = isMorningWeek(selectedWeek, weekNum, isMorning);

    let row = `<tr class="slowMotionAnimateClose ${
      isThisWeekMorning ? "morning" : "evening"
    }">
                      <td class='dateShift '>از ${currentDate.format(
                        "jYYYY/jMM/jDD"
                      )} تا ${currentDate
      .clone()
      .endOf("week")
      .format("jYYYY/jMM/jDD")}</td>
                      <td>${isThisWeekMorning ? "🌞 صبح" : "🌙 عصر"}</td>
                     </tr>`;
    tableBody.innerHTML += row;

    currentDate.add(1, "weeks"); // رفتن به هفته‌ی بعد
  }
}
function searchInShiftDate(date) {
  let dateShift = document.querySelectorAll(".dateShift");
  if (!date)
    return Array.from(dateShift).forEach((item) => {
      item.parentElement.classList.remove("active");
    });
  Array.from(dateShift).forEach((item) => {
    item.parentElement.classList.add("active");
  });
  Array.from(dateShift).forEach((item) => {
    if (item.textContent.includes(date) || date.includes(item.textContent)) {
      item.parentElement.classList.remove("active");
    }
  });
}

async function userEducationalBaseChangeHand(parentId) {
  $(`#${parentId} .scoreInput`).val("");

  $(`#${parentId} .bookName`).empty("");

  $(`#${parentId} .reshteParent`).addClass("hidden");
  $(`#${parentId} .bookSelectParent`).addClass("hidden");
  $(`#${parentId} .textBookParent`).addClass("hidden");

  const options = $(`#${parentId} .educationalBaseAddScore`)[0].options;
  let index;
  Array.from(options).find((item, i) => {
    if (item.value === $(`#${parentId} .educationalBaseAddScore`).val())
      return (index = i);
  });
  if ($(`#${parentId} .reshteSelect`).val() === "غیر نظری" && index > 9) {
    $(`#${parentId} .bookSelectParent`).addClass("hidden");
    $(`#${parentId} .textBookParent`).removeClass("hidden");
    $(`#${parentId} .reshteParent`).removeClass("hidden");
    return;
  }
  $(`#${parentId} .bookSelectParent`).removeClass("hidden");
  $(`#${parentId} .textBookParent`).addClass("hidden");
  try {
    booksArray = await (await fetch("/books.json")).json();
  } catch (e) {}

  switch (true) {
    case index <= 9:
      booksArray[$(`#${parentId} .educationalBaseAddScore`).val()]?.forEach(
        (item) => {
          $(`#${parentId} .bookName`).append(
            $(`<option value="${item}">${item}</option>`)
          );
        }
      );
      break;
    case index > 9:
      $(`#${parentId} .reshteParent`).removeClass("hidden");
      booksArray[$(`#${parentId} .educationalBaseAddScore`).val()][
        $(`#${parentId} .reshteSelect`).val()
      ]?.forEach((item) => {
        $(`#${parentId} .bookName`).append(
          $(`<option value="${item}">${item}</option>`)
        );
      });
      break;
  }
}

$("#addScoreForm").submit(async (e) => {
  e.preventDefault();
  let educationalBaseAddScore = $(
      "#addScoreForm .educationalBaseAddScore"
    )[0].value.trim(),
    scoreInput = $(`#addScoreForm .scoreInput`)[0].value,
    bookName = $("#addScoreForm .bookName")[0].value.trim(),
    dateBookQuestion = $("#addScoreForm .dateBookQuestion")[0].value.trim(),
    requestScoreType = $("#addScoreForm .requestScoreType")[0].value.trim(),
    reshteSelect = $("#addScoreForm .reshteSelect")[0].value.trim();

  if (reshteSelect === "غیر نظری") {
    bookName = $("#addScoreForm .bookTextName")[0].value;
    reshteSelect = bookName.split("-")[0].trim();
    bookName = bookName.split("-")[1].trim();
  }
  const datas = {
    educationalBaseAddScore,
    bookName,
    dateBookQuestion,
    scoreInput,
    reshteSelect,
    scoreType: requestScoreType,
  };
  try {
    const res = await (
      await fetch(`/addUserBookScore/${userId}`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(datas),
      })
    ).json();
    Swal.fire({
      icon: res.status ? "success" : "error",
      text: res.message,
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  }
});

async function showChart() {
  let educationalBaseAddScore = $(`#showChartForm .educationalBaseAddScore`)[0]
      .value,
    bookName = $(`#showChartForm .bookName`)[0].value,
    dateFrom = $(`#showChartForm .dateFrom`)[0].value,
    dateTo = $(`#showChartForm .dateTo`)[0].value,
    reshteSelect = $(`#showChartForm .reshteSelect`)[0].value;

  if (reshteSelect === "غیر نظری") {
    bookName = $("#addScoreForm .bookTextName")[0].value;
    reshteSelect = bookName.split("-")[0];
    bookName = bookName.split("-")[1];
  }
  const datas = {
    educationalBaseAddScore,
    bookName,
    dateFrom,
    dateTo,
    reshteSelect,
  };
  try {
    let datas_query = convertToQuery(datas);

    const res = await (
      await fetch(`/getScores/${userId}?${datas_query}`)
    ).json();

    if (scoreChart) scoreChart.destroy();

    if (res.status) {
      $("#canvasCont").removeClass("h-0");
      $("#pcsResult").text(res.values.score.length);
      scoreChart = new Chart($("canvas")[0].getContext("2d"), {
        type: $("#chartType").val(),
        data: {
          labels: res.values.date,
          datasets: [
            {
              label: "نمره",
              data: res.values.score,
              borderWidth: 2,
              fill: true,
              tension: 0.1,
              pointRadius: 4,
              pointHoverRadius: 8,
              backgroundColor: "lightblue",
              borderColor: "black",
            },
          ],
        },
        options: {
          scales: {
            y: {
              min: 0,
              max: 20,
              ticks: {
                stepSize: 5,
              },
            },
          },
          plugins: {
            legend: { display: false },

            zoom: {
              pan: {
                enabled: true,
                mode: "x",
                threshold: 10,
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },
                mode: "x",
              },
            },
          },
        },
      });
      $("canvas")[0].scrollIntoView({ behavior: "smooth" });
    } else
      Swal.fire({
        icon: "error",
        text: res.message,
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  }
}

$("#showChartForm").submit((e) => {
  e.preventDefault();
  showChart();
});
function transformData(allData) {
  const result = [];

  const allDates = new Set();

  Object.values(allData).forEach((subject) => {
    subject.forEach((item) => {
      allDates.add(item.date);
    });
  });

  Array.from(allDates).forEach((date) => {
    const row = { date };

    Object.keys(allData).forEach((subject) => {
      const scoreItem = allData[subject].find((item) => item.date === date);
      row[subject] = scoreItem ? scoreItem.score : null;
    });

    result.push(row);
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

function showAllScoreMember(res) {
  let { allData, allBooks } = res.values;

  if (Object.keys(allData).length === 0)
    return Swal.fire({
      icon: "info",
      text: "این کاربر نمره ای برای پایه انتخاب شده ندارد.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  allBooks.forEach((item) => {
    if (!allData[item]) allData[item] = [{ date: "" }];
  });

  let allDates = new Set();
  allData.forEach((item) => {
    Object.keys(item.scores).forEach((date) => {
      allDates.add(date);
    });
  });

  const sortedDates = Array.from(allDates).sort((a, b) => {
    const toNumber = (d) => parseInt(d.replace(/\//g, ""));
    return toNumber(a) - toNumber(b);
  });

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const lessonHeader = document.createElement("th");
  lessonHeader.textContent = "درس";
  headerRow.appendChild(lessonHeader);

  sortedDates.forEach((date) => {
    const th = document.createElement("th");
    th.textContent = date;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  allData.forEach((item) => {
    const row = document.createElement("tr");

    const lessonCell = document.createElement("td");

    lessonCell.textContent = item.lesson;
    row.appendChild(lessonCell);

    sortedDates.forEach((date) => {
      const scoreCell = document.createElement("td");
      scoreCell.textContent = item.scores[date] ?? "-";
      row.appendChild(scoreCell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  const winHtml = `
  <!DOCTYPE html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>${res.values.firstName + " " + res.values.lastName}</title>
    <style>
    *{
    white-space: nowrap;
    }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0px auto;
    direction: rtl;
    font-family: sans-serif;
    font-size: 13px;
  }

  th,
  td {
    border: 1px solid #999;
    padding: 8px 12px;
    text-align: center;
  }
     .table2 {
     }
  .table2 tbody tr:nth-child(odd) {
    background-color: #ccc;
  }

  thead {
    background-color: #f2f2f2;
    font-weight: bold;
  }
 *{
    padding:0;
    margin:0;
    box-sizing:border-box;
    }
 @media print {
  @page {
    size: A4 portrait;
  }
  body {
    width: 18cm; 
    margin:0 auto;
  }
}
</style>
  </head>
  <body>
    <div style="margin: auto">
      <table>
      ${table.innerHTML}
      </table>
    </div>
 ${
   scoreChart
     ? ` 
     <div style="width:100%;">
      <a src="${scoreChart?.toBase64Image("image/png")}" download="${
         res.values.firstName + " " + res.values.lastName
       }.png">
        <img onload="loadImage()" onerror="errorImage(this)" style="width:100%;aspect-ratio: 16 / 9;object-fit:contain" src="${scoreChart?.toBase64Image(
          "image/png"
        )}" />
       </a> 
     </div>
     `
     : ""
 }

 <script>
 
 document
    .addEventListener("DOMContentLoaded", () => {
      if(!document.querySelector('img'))
      window.print();
    });
     if(document.querySelector('img'))
    document.querySelector('img').addEventListener('load',()=>{
         window.print();
      })
 </script>
  </body>
</html>
`;
  let newWind = window.open("", "_blank");
  newWind.document.write(winHtml);

  newWind.document.close();
}
function showScoreAOwnYear(res) {
  let { scores } = res;

  if (Object.keys(scores).length === 0)
    return Swal.fire({
      icon: "info",
      text: "این کاربر نمره ای برای پایه انتخاب شده ندارد.",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  let trs = "<tr>";
  let books = "";
  if (
    Object.keys(booksArray).indexOf($(".educationalBaseAddScore")[1].value) +
      1 >
    9
  ) {
    books =
      booksArray[$(".educationalBaseAddScore")[1].value][
        $(".reshteSelect")[1].value
      ];
  } else {
    books = booksArray[$(".educationalBaseAddScore")[1].value];
  }
  let bookNotFound = books.filter((item) => {
    if (!Object.keys(scores)?.find((it) => item === it)) return item;
  });
  let newBooks = {};
  bookNotFound.forEach((item) => {
    newBooks[item] = {
      mostamar: null,
      middleOwn: null,
      middleTow: null,
      mostamarClass: null,
      mostamarTow: null,
    };
  });
  const newScores = { ...scores, ...newBooks };

  Object.keys(newScores).forEach((item, index) => {
    trs += `
          <tr>
            <td>${index}</td>
            <td>${item}</td>
            <td>${
              newScores[item].mostamar ? newScores[item].mostamar : "---"
            }</td>
            <td>${
              newScores[item].middleOwn ? newScores[item].middleOwn : "---"
            }</td>
            <td>${
              newScores[item].mostamarTow ? newScores[item].mostamarTow : "---"
            }</td>
            <td>${
              newScores[item].middleTow ? newScores[item].middleTow : "---"
            }</td>
          </tr>
    `;
  });
  trs += "</tr>";
  const winHtml = `
 <!DOCTYPE html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>${
      $("[name=firstName]").val() + " " + $("[name=lastName]").val()
    }</title>
    <style>

    *{
    padding:0;
    margin:0;
    box-sizing:border-box;
    }
   @media print {
  @page {
    size: A4 portrait;
  }
  body {
    width: 18cm; 
    margin:0 auto;
  }
}
      body {
    font-family: sans-serif;
        padding: 20px;
      }

      .report-card {
        width: 100%;
        margin: 0 auto;
        background: #fff;
        padding: 30px;
        border: 2px solid #333;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        position:relative;
      }

      .header {
        text-align: center;
        margin-bottom: 20px;
      }

      .header h1 {
        margin: 0;
        font-size: 24px;
      }

      .student-info {
        margin-bottom: 20px;
        font-size: 16px;
      }

      .student-info span {
        display: inline-block;
        width: 200px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      table,
      th,
      td {
        border: 1px solid #000;
      }

      th,
      td {
        padding: 10px;
        text-align: center;
      }

      .summary {
        font-size: 16px;
        text-align: left;
      }
    </style>
  </head>
  <body>
    <div class="report-card">
      ${
        server_image_url || member_image_url
          ? `<img src="${
              server_image_url || member_image_url
            }" style="left:10px;top:10px;position:absolute;width: 120px;height: 120px;aspect-ratio: 3 / 4;object-fit: contain;" />`
          : ""
      }
      <div class="header">
        <h1>کارنامه تحصیلی</h1>
        <p>سال تحصیلی: </p>
      </div>

      <div class="student-info">
        <p><span>نام:</span> ${$("[name=firstName]").val()}</p>
        <p><span>پایه:</span> ${$("[name=lastName]").val()}</p>
        ${res.reshte ? `<p><span>رشته:</span> ${res.reshte}</p>` : ""}
        <p><span>کد ملی:</span> ${$("[name=nationalId]").val()}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>ردیف</th>
            <th>نام درس</th>
            <th>مستمر نوبت اول</th>
            <th>نوبت اول</th>
            <th>مستمر نوبت دوم</th>
            <th>نوبت دوم</th>
          </tr>
        </thead>
        <tbody>
          ${trs}
        </tbody>
      </table>

      <div class="summary">
        <p><strong>معدل کل:</strong>---</p>
        <p><strong>نتیجه:</strong> ---</p>
      </div>
    </div>
  
<script>
 
  document
    .addEventListener("DOMContentLoaded", () => {
      if(!document.querySelector('img'))
      window.print();
    });
     if(document.querySelector('img'))
    document.querySelector('img').addEventListener('load',()=>{
         window.print();
      })
 </script>
  </body>
</html>

`;
  let newWind = window.open("", "_blank");

  newWind.document.write(winHtml);

  newWind.document.close();
}

$("#printButton").click(async () => {
  try {
    let educationalBaseAddScore = $(
        `#showChartForm .educationalBaseAddScore`
      )[0].value,
      bookName = $(`#showChartForm .bookName`)[0].value,
      dateFrom = $(`#showChartForm .dateFrom`)[0].value,
      dateTo = $(`#showChartForm .dateTo`)[0].value,
      reshteSelect = $(`#showChartForm .reshteSelect`)[0].value;

    if (reshteSelect === "غیر نظری") {
      bookName = $("#addScoreForm .bookTextName")[0].value;
      reshteSelect = bookName.split("-")[0];
      bookName = bookName.split("-")[1];
    }
    const datas = {
      educationalBaseAddScore,
      bookName,
      dateFrom,
      dateTo,
      reshteSelect,
      type: $("#printType").val(),
    };

    for (const key in datas) {
      if (
        !datas[key] &&
        document.querySelector(`#showChartForm .${key}`).checkVisibility()
      ) {
        document.querySelector(`#showChartForm .${key}`).focus();
        Swal.fire({
          icon: "error",
          text: 'همه ی فیلد ها را پر کنید.',
          confirmButtonText: "تایید",
          customClass: {
            confirmButton: "button",
          },
        });
        return;
      }
    }
    let datas_query = convertToQuery(datas);

    const res = await (
      await fetch(`/getAllScoresMember/${userId}?${datas_query}`)
    ).json();
    if (res.status) {
      if ($("#printType").val() === "all") showAllScoreMember(res);
      else {
        showScoreAOwnYear(res);
      }
    } else
      Swal.fire({
        icon: "error",
        text: res.message,
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
  } catch (e) {
    console.error(e);

    Swal.fire({
      icon: "error",
      text: "مشکل در سیستم",
      confirmButtonText: "تایید",
      customClass: {
        confirmButton: "button",
      },
    });
  }
});
