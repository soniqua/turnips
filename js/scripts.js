//Reusable Fields
const getSellFields = function () {
  let fields = []
  for (var i = 2; i < 14; i++) {
    fields.push($("#sell_" + i)[0])
  }
  return fields
}

const getFirstBuyRadios = function () {
  return [
    $("#first-time-radio-no")[0],
    $("#first-time-radio-yes")[0]
  ];
}

const getPreviousPatternRadios = function () {
  return [
    $("#pattern-radio-unknown")[0],
    $("#pattern-radio-fluctuating")[0],
    $("#pattern-radio-small-spike")[0],
    $("#pattern-radio-large-spike")[0],
    $("#pattern-radio-decreasing")[0]
  ];
}

const getTurnipCount = function () {
  return $("#turnipCount")[0].value
}

const getCheckedRadio = function (radio_array) {
  return radio_array.find(radio => radio.checked === true).value;
}

const checkRadioByValue = function (radio_array, value) {
  if (value === null) {
    return;
  }
  value = value.toString();
  radio_array.find(radio => radio.value == value).checked = true;
}

const sell_inputs = getSellFields()
const buy_input = $("#buy")
const first_buy_radios = getFirstBuyRadios()
const previous_pattern_radios = getPreviousPatternRadios()
const permalink_input = $('#permalink-input')
const permalink_button = $('#permalink-btn')
const snackbar = $('#snackbar')
const turnip_input = $("#turnipCount")
var turnip_manager = "";

//Functions
const fillFields = function (prices, first_buy, previous_pattern, turnip_count) {
  checkRadioByValue(first_buy_radios, first_buy);
  checkRadioByValue(previous_pattern_radios, previous_pattern);
  turnip_input.focus();
  turnip_input.val(turnip_count);
  turnip_input.blur();

  buy_input.focus();
  buy_input.val(prices[0] || '')
  buy_input.blur();
  const sell_prices = prices.slice(2)

  sell_prices.forEach((price, index) => {
    if (!price) {
      return
    } else {
      const element = $("#sell_" + (index + 2));
      element.focus();
      element.val(price);
      element.blur();
    }
  })
}

const initialize = function () {
  try {
    const previous = getPrevious();
    const first_buy = previous[0];
    const previous_pattern = previous[1];
    const prices = previous[2];
    const turnip_count = previous[3];
    if (prices === null) {
      fillFields([], first_buy, previous_pattern, turnip_count)
    } else {
      fillFields(prices, first_buy, previous_pattern, turnip_count)
    }
  } catch (e) {
    console.error(e);
  }

  $(document).trigger("input");

  $("#permalink-btn").on("click", copyPermalink)

  $("#stats").on("click", showStats)

  $("#turnipCount").blur(function(){
    let position = document.getElementById("turnipCount").getBoundingClientRect()
    let options = {
      particleCount: 30,
      origin: {
        x : 0.5,
        y: (position.y/window.innerHeight)
      },
      ticks: 75,
      gravity: 2,
      colors: ["FFAA00"],
      shapes: ["square"]
    }
    window.confetti(options);
  })

  $("#reset").on("click", function () {
    if (window.confirm(i18next.t("prices.reset-warning"))) {
      sell_inputs.forEach(input => input.value = '')
      fillFields([], false, -1, 0)
      update()
    }
  })
}

const updateLocalStorage = function (prices, first_buy, previous_pattern, turnip_count) {
  try {
    if (prices.length !== 14) throw "The data array needs exactly 14 elements to be valid"
    localStorage.setItem("sell_prices", JSON.stringify(prices))
    localStorage.setItem("first_buy", JSON.stringify(first_buy));
    localStorage.setItem("previous_pattern", JSON.stringify(previous_pattern));
    localStorage.setItem("turnip_count", turnip_count);
  } catch (e) {
    console.error(e)
  }
}

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value))
  return filtered.length == 0
}

const getFirstBuyStateFromQuery = function (param) {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const firstbuy_str = params.get(param);

    if (firstbuy_str == null) {
      return null;
    }

    firstbuy = null;
    if (firstbuy_str == "1" || firstbuy_str == "yes" || firstbuy_str == "true") {
      firstbuy = true;
    } else if (firstbuy_str == "0" || firstbuy_str == "no" || firstbuy_str == "false") {
      firstbuy = false;
    }

    return firstbuy;

  } catch (e) {
    return null;
  }
}

const getFirstBuyStateFromLocalstorage = function () {
  return JSON.parse(localStorage.getItem('first_buy'))
}

const getPreviousPatternStateFromLocalstorage = function () {
  return JSON.parse(localStorage.getItem('previous_pattern'))
}

const getTurnipCountFromLocalStorage = function () {
  return localStorage.getItem('turnip_count')
}

const getPreviousPatternStateFromQuery = function (param) {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const pattern_str = params.get(param);

    if (pattern_str == null) {
      return null;
    }

    if (pattern_str == "0" || pattern_str == "fluctuating") {
      pattern = 0;
    } else if (pattern_str == "1" || pattern_str == "large-spike") {
      pattern = 1;
    } else if (pattern_str == "2" || pattern_str == "decreasing") {
      pattern = 2;
    } else if (pattern_str == "3" || pattern_str == "small-spike") {
      pattern = 3;
    } else {
      pattern = -1;
    }

    return pattern;

  } catch (e) {
    return null;
  }
}

const getPricesFromLocalstorage = function () {
  try {
    const sell_prices = JSON.parse(localStorage.getItem("sell_prices"));

    if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
      return null;
    }

    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPricesFromQuery = function (param) {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const sell_prices = params.get(param).split(".").map((x) => parseInt(x, 10));

    if (!Array.isArray(sell_prices)) {
      return null;
    }

    // Parse the array which is formatted like: [price, M-AM, M-PM, T-AM, T-PM, W-AM, W-PM, Th-AM, Th-PM, F-AM, F-PM, S-AM, S-PM, Su-AM, Su-PM]
    // due to the format of local storage we need to double up the price at the start of the array.
    sell_prices.unshift(sell_prices[0]);

    // This allows us to fill out the missing fields at the end of the array
    for (let i = sell_prices.length; i < 14; i++) {
      sell_prices.push(0);
    }

    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPreviousFromQuery = function () {
  /* Check if valid prices are entered. Exit immediately if not. */
  const prices = getPricesFromQuery("prices");
  if (prices == null) {
    return null;
  }

  //console.log("Using data from query.");
  window.populated_from_query = true;
  return [
    getFirstBuyStateFromQuery("first"),
    getPreviousPatternStateFromQuery("pattern"),
    prices
  ];
};

const getPreviousFromLocalstorage = function () {
  return [
    getFirstBuyStateFromLocalstorage(),
    getPreviousPatternStateFromLocalstorage(),
    getPricesFromLocalstorage(),
    getTurnipCountFromLocalStorage()
  ];
};


/**
 * Gets previous values. First tries to parse parameters,
 * if none of them match then it looks in local storage.
 * @return {[first time, previous pattern, prices]}
 */
const getPrevious = function () {
  return getPreviousFromQuery() || getPreviousFromLocalstorage();
};

const getSellPrices = function () {
  //Checks all sell inputs and returns an array with their values
  return res = sell_inputs.map(function (input) {
    return parseInt(input.value || '');
  })
}

const getPriceClass = function(buy_price, max) {
  const priceBrackets = [200, 30, 0, -30, -99];
  let diff = max - buy_price;
  for(var i=0; i<priceBrackets.length; i++) {
    if(diff >= priceBrackets[i]) {
      return "range" + i;
    }
  }
  return "";
}

const displayPercentage = function(fraction) {
  if (Number.isFinite(fraction)) {
    let percent = fraction * 100;
    if (percent >= 1) {
      return percent.toPrecision(3) + '%';
    } else if (percent >= 0.01) {
      return percent.toFixed(2) + '%';
    } else {
      return '<0.01%';
    }
  } else {
    return '—'
  }
}

const calculateOutput = function (data, first_buy, previous_pattern) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  let predictor = new Predictor(data, first_buy, previous_pattern);
  let analyzed_possibilities = predictor.analyze_possibilities();
  let buy_price = parseInt(buy_input.val());
  previous_pattern_number = ""
  //define an empty object and use this to track which day is potentially best:
  var sell_tracker = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var price_tracker = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var max_tracker = [];
  for (let poss of analyzed_possibilities) {
    var tracker_index = 0
    var out_line = "<tr><td class='table-pattern'>" + poss.pattern_description + "</td>"
    if (previous_pattern_number != poss.pattern_number) {
      previous_pattern_number = poss.pattern_number
      pattern_count = analyzed_possibilities
        .filter(val => val.pattern_number == poss.pattern_number)
        .length
      out_line += `<td rowspan=${pattern_count}>${displayPercentage(poss.category_total_probability)}</td>`;
    }
    out_line += `<td>${displayPercentage(poss.probability)}</td>`;

    for (let day of poss.prices.slice(1)) {
      let price_class = getPriceClass(buy_price, day.max);
      if (price_class === "range1"){
        //this price is the best class, and should be tracked:
        sell_tracker[tracker_index] = (sell_tracker[tracker_index] + 1)
        max_tracker = poss.weekMax
        if (day.max > price_tracker[tracker_index]){
          price_tracker[tracker_index] = day.max
        }
      }
      tracker_index = (tracker_index + 1)
      if (day.min !== day.max) {
        out_line += `<td class='${price_class}'>${day.min} ${i18next.t("output.to")} ${day.max}</td>`;
      } else {
        out_line += `<td class='${price_class}'>${day.min}</td>`;
      }
    }

    var min_class = getPriceClass(buy_price, poss.weekGuaranteedMinimum);
    var max_class = getPriceClass(buy_price, poss.weekMax);
    out_line += `<td class='${min_class}'>${poss.weekGuaranteedMinimum}</td><td class='${max_class}'>${poss.weekMax}</td></tr>`;
    output_possibilities += out_line
  }

  let normal_list=[];
  for (i=0; i<14; i++) {
    normal_list[i]=sell_tracker[i]*(price_tracker[i]/max_tracker)
  }

  //console.log(normal_list)
  //console.log(normal_list.indexOf(Math.max(...normal_list)));
  //This only forecasts expected days, unless I fux the above
  const best_day = getSellTracker(normal_list)
  //Sunday is always 0, and should not be used.
  //console.log(`${best_day}`)
  $("#turnip_best_day").html(best_day)

  $("#output").html(output_possibilities)

  update_chart(data, analyzed_possibilities);
}

function getSellTracker(data){
  let max = data.indexOf(Math.max(...data));
  if (max <= 0){
    //this is a race condition,
  } else {
  //Monday AM is 1, PM is 2, etc.
  const times = ["Sunday", "Monday AM", "Monday PM", "Tuesday AM", "Tuesday PM", "Wednesday AM", "Wednesday PM", "Thursday AM", "Thursday PM", "Friday AM", "Friday PM", "Saturday AM", "Saturday PM"]
  //If today want to change message:
  let today = ((new Date().getDay())*2);
  if (today == 0){
    //Sunday
  } else {
  if (isMorning()){
    today = today -1
  }
  //Does a price already exist for a day, and is that day in the past?
  if (max < today){
    //console.log(`${max}`, `${today}`)
    //console.log("In the past")
    data[max] = 0
    return getSellTracker(data)
  } else {
    //console.log(`${max}`, `${today}`)
    //console.log("Legit")
    return times[max]
  }
}
}
}

const generatePermalink = function (buy_price, sell_prices, first_buy, previous_pattern) {
  let searchParams = new URLSearchParams();
  let pricesParam = buy_price ? buy_price.toString() : '';

  if (!isEmpty(sell_prices)) {
    const filtered = sell_prices.map(price => isNaN(price) ? '' : price).join('.');
    pricesParam = pricesParam.concat('.', filtered);
  }

  if (pricesParam) {
    searchParams.append('prices', pricesParam);
  }

  if (first_buy) {
    searchParams.append('first', true);
  }

  if (previous_pattern !== -1) {
    searchParams.append('pattern', previous_pattern);
  }

  return searchParams.toString() && window.location.origin.concat('?', searchParams.toString());
}

const copyPermalink = function () {
  let text = permalink_input[0];

  permalink_input.show();
  text.select();
  text.setSelectionRange(0, 99999); /* for mobile devices */

  document.execCommand('copy');
  permalink_input.hide();

  flashMessage(i18next.t("prices.permalink-copied"));
}

function hideOrShow (element){
  if (element.style.display == ""){
    element.style.display = "block"
  } else {
    element.style.display= ""
  }
}

const showStats = function(){
  let graph = document.getElementsByClassName("chart-wrapper")
  let table = document.getElementsByClassName("table-wrapper")
  hideOrShow(graph[0]);
  hideOrShow(table[0]);
}

const flashMessage = function(message) {
  snackbar.text(message);
  snackbar.addClass('show');

  setTimeout(function () {
    snackbar.removeClass('show')
    snackbar.text('');
  }, 3000);
}

function checkEmpty(price){
  if ( ! isNaN(price)){
      return price
  }
}

function isMorning(){
  const hours = new Date().getHours();
  if (hours <= 12){
    return true
  } else {
    return false
  }
}

function getTodayValue(prices){
  let today = (new Date().getDay())*2;
  if (isMorning()){
    today = today - 1
  }
  if (isNaN(prices[today-1])){
    return 1
  } else {
  return prices[today]
  }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const getMaxProfit = function(){
  //Get sell prices
  const raw_prices = getSellPrices();
  //Check if the current day and period has a valid entry.
  //Logic here is that each day has two divisions (AM, PM). Each day is therefore multiplied by two, and if pre-noon the day has -1.
  let todays_price = getTodayValue(raw_prices)
  //console.log(`Today's price is ${todays_price}`);
  const turnip_count = getTurnipCount();
  const buy_price = parseInt(buy_input.val());
  //Filter `NaN` from array;
  //Get ratio;
  const turnip_ratio = (todays_price / buy_price * 100);
  ////console.log(`Turnip Profit/Loss ratio is ${turnip_ratio} per turnip`);
  const gross_income= (turnip_count * todays_price);
  ////console.log(`Gross income is ${gross_income}`);
  const estimated_cost = (buy_price * turnip_count);
  ////console.log(`Estimated cost is ${estimated_cost}`);
  const net_profit = gross_income - estimated_cost
  ////console.log(`Net Profit is ${net_profit} Bells`);
  //Set id:
  if (new Date().getHours() < 22 && new Date().getHours() > 7){
    if (todays_price > 1){
        $("#turnip_output").html(`${numberWithCommas(gross_income)} Bells <br/><br/> at ${todays_price} Bells/turnip <br/><br/>(${Math.floor(turnip_ratio)}% ROI on ${numberWithCommas(estimated_cost)} Bells)`)
      } else {
        $("#turnip_output").html(`No price for today!`)
      }
    //Set color:
    if (net_profit <= 0){
      $("#turnip_output").css('color', 'red');
      } else {
        $("#turnip_output").css('color', 'green');
      }
    } else {
      //console.log("shop ded")
      $("#turnip_output").html(`Nook's Cranny is currently closed!`)
    }
}

const update = function () {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = getCheckedRadio(first_buy_radios) == 'true';
  const previous_pattern = parseInt(getCheckedRadio(previous_pattern_radios));
  const turnip_count = getTurnipCount();

  buy_input[0].disabled = first_buy;
  buy_input[0].placeholder = first_buy ? '—' : '...'

  const permalink = generatePermalink(buy_price, sell_prices, first_buy, previous_pattern);
  if (permalink) {
    permalink_button.show();
  } else {
    permalink_button.hide();
  }
  permalink_input.val(permalink);

  const prices = [buy_price, buy_price, ...sell_prices];

  if (!window.populated_from_query) {
    updateLocalStorage(prices, first_buy, previous_pattern, turnip_count);
  }

  getMaxProfit();

  calculateOutput(prices, first_buy, previous_pattern);
}
