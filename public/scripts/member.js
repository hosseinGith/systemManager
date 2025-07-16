const form = document.querySelector("form");
const loading = document.querySelector(".loading");
const allFormInputs = form.querySelectorAll(
  "input:not([type='hidden']),select:not([type='hidden']),textarea:not([type='hidden'])"
);
// Chart.register(zoomPlugin);
Chart.register(ChartZoom); // دقت کن اسم پلاگین ChartZoom هست

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
  memebr = await (
    await fetch("/getMemebrData", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ id: userId }),
    })
  ).json();
  console.log(memebr);
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
  userEducationalBaseChangeHand(`addScoreForm`);
  userEducationalBaseChangeHand(`showChartForm`);
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
  if (Object.values(body).length === 0) {
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
      let res = await (
        await fetch("/edit-member/" + userId, {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify(body),
        })
      ).json();
      console.log(res);
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
        document.querySelector("#titleOfthePage").textContent =
          "کاربر: " +
          document.querySelector('[name="firstName"]').value +
          " " +
          document.querySelector('[name="lastName"]').value;
        memebr = await (
          await fetch("/getMemebrData", {
            method: "POST",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify({ id: userId }),
          })
        ).json();
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
      console.log(e);
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
  console.log(dateInput);
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
  console.log(date);
  Array.from(dateShift).forEach((item) => {
    item.parentElement.classList.add("active");
  });
  Array.from(dateShift).forEach((item) => {
    if (item.textContent.includes(date) || date.includes(item.textContent)) {
      item.parentElement.classList.remove("active");
    }
  });
}

function userEducationalBaseChangeHand(parentId) {
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
    if (res.status)
      Swal.fire({
        icon: "success",
        text: "عملیات موفق",
        confirmButtonText: "تایید",
        customClass: {
          confirmButton: "button",
        },
      });
    else
      Swal.fire({
        icon: "error",
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
    const res = await (
      await fetch(`/getScores/${userId}`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(datas),
      })
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
    console.log(error);

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
    };
    const res = await (
      await fetch(`/getAllScoresMember/${userId}`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(datas),
      })
    ).json();
    if (res.status) {
      let { allData, allBooks } = res.values;
      console.log(allData.length);

      if (allBooks.length === 0)
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
      console.log(allBooks, allData);

      let row = Object.keys(allData);
      let transformedData = transformData(allData);
      let th = "";
      let trs = "";
      row.forEach((key) => {
        th += `<th>${key}</th>`;
      });

      for (let index = 0; index < transformedData.length; index++) {
        if (transformedData[index].date) {
          let tr = `<tr>
        <td>${transformedData[index].date}</td>
        `;
          for (const bookName in transformedData[index]) {
            if (bookName !== "date")
              tr += `<td>${transformedData[index][bookName] || "--"}</td>`;
          }
          tr += `</tr>`;

          trs += tr;
        }
      }

      const winHtml = `
      <!DOCTYPE html>
    <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${allData}</title>
        <style>
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
      .table2 tbody tr:nth-child(odd) {
        background-color: #ccc;
      }

      thead {
        background-color: #f2f2f2;
        font-weight: bold;
      }

      @media print {
        thead {
          background-color: #f2f2f2 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
      </head>
      <body>
        <div style="margin: auto">
          <table>
            <thead>
              <tr>
                <th>نام</th>
                <th>نام خانوادگی</th>
                <th>کلاس</th>
                <th>تاریخ شروع</th>
                <th>تا تاریخ</th>
                <th>سال تحصیلی</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${res.values.firstName}</td>
                <td>${res.values.lastName}</td>
                <td>${res.values.educationalBase}</td>
                <td>${$(".dateFrom").val()}</td>
                <td>${$(".dateTo").val()}</td>
                <td dir="ltr">${res.values.educationalDate}</td>
              </tr>
            </tbody>
          </table>
               <table class="table2">
        <thead>
          <tr>
            <th>تاریخ / درس</th>
            ${th}
          </tr>
        </thead>
        <tbody>
        ${trs}
        </tbody>
      </table>
        </div>
      </body>
    </html>
 `;
      let newWind = window.open("", "_blank");

      newWind.document.write(winHtml);
      newWind.print();
      newWind.document.close();
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
    console.log(e);

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
