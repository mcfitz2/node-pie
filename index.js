var request = require("request"), 
cheerio = require("cheerio"),
moment = require("moment");

String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
function isNotEmpty(object) {for(var i in object) { return true; } return false; }
function rfc3339(mmt) {return mmt.format("YYYY-MM-DDTHH:mm:ssZ");}
var BASE_URL = "https://pie.indiana.edu/apps/tcc/"
module.exports = PIE = function(username, password) {
    this.username = username;
    this.password = password;
    this.logged_in = false;
};
PIE.prototype.login = login = function(callback) {
    if (!(this.username && this.password)) {
	return callback(new Error("Username/password empty"), null, null);
    }
    var self = this;
    request.post({url:BASE_URL+"login.cfm",
                  form:{"Username":this.username,
                        "Password":this.password,
                        "submit":"Login"},
                  jar:true}, function(err, res, body) {
		      self.logged_in = true;
		      callback(err, res, body);
		  });
}

PIE.prototype.subs = subs = function(callback) {
    if (this.logged_in) {
	var subs = [];
	login(username, password, function(err, res, body) {
	    request.get({url:BASE_URL+"main/view_subs.cfm", jar:true}, function(err, res, body) {
		var $ = cheerio.load(body);
		$("div#content > table > tr:not(.iulightgray)").each(function(index, row) {
		    var sub = {};
		    var keys = ["","","date", "site", "start", "end"];
		    $(row).find("td").each(function(index, field) {
			if (index > 1 && index < 6) {
			    var val = $(field).text().trim();
			    if (val.length > 0) {
				sub[keys[index]] = val;
			    }
			}
		    });
		    if (isNotEmpty(sub) && !sub.site.contains("CS") && !sub.site.contains("LEAD")) {
			var start = moment(sub.date + " "+ sub.start);
			var end = moment(sub.date + " "+ sub.end);
			if (end < start) {
			    end.add("days", 1);
			}
			//  console.log("-------------------------");
			// console.log({start:rfc3339(start), end:rfc3339(end), site:sub.site});
			// start.zone(300);
			//end.zone(300);
			//    console.log({start:rfc3339(start), end:rfc3339(end), site:sub.site});
			subs.push({start:rfc3339(start), end:rfc3339(end), site:sub.site});
		    }
		    
		});
		callback(err, subs);
	    });
	});
    }
}
PIE.prototype.timesheet = timesheet = function(periods, callback) {
    if (typeof day === "function") {
	callback = day;
	request.get({jar:true, url:"https://pie.indiana.edu/apps/tcc/main/view_timesheet.cfm"}, function(err, res, body) {
	    var $ = cheerio.load(body);
	    var sum = 0;
	    $("#content > form:nth-child(6) > table > tr:nth-child(5) > td:nth-child(2)").each(function(i, el) {
		sum += parseFloat($(el).contents()[0].data);
	    });
	    callback(err, {hours: sum});
	});
    } else {
	request.get({jar:true, url:"https://pie.indiana.edu/apps/tcc/main/view_timesheet.cfm"}, function(err, res, body) {
	    var $ = cheerio.load(body);
	    var currentPeriod = $('input[name="period_id"]').val();
	    $ul = $('form[name="payperiod_choice"] > select > option[value="'+currentPeriod+'"]')
	    for (var i = 0; i < periods; i++) {
		$ul = $ul.prev();
	    }
	    request.post({jar:true, url:"https://pie.indiana.edu/apps/tcc/main/view_timesheet.cfm", form:{period_id:$ul.val()}}, function(req, res, body) {
		var $ = cheerio.load(body);
		var sum = 0;
		$("#content > form:nth-child(6) > table > tr:nth-child(5) > td:nth-child(2)").each(function(i, el) {
		    sum += parseFloat($(el).contents()[0].data);
		});
		callback(err, {hours: sum});
	    });
	});
    }
}
PIE.prototype.shifts = shifts = function(pie_username, callback) {
    if (this.logged_in) {
	request.get({url:BASE_URL+"schedules/schedule.cfm", qs:{username:pie_username}, jar:true}, function(err, res, body) {
            var $ = cheerio.load(body);
	    $("td.iuCream").each(function(index, el) {
		var site = $(el).find("span:nth-of-type(2)").first().text();
		if (site.match(/\S/)) {
		    console.log(el.attribs.title, site);
		}
	    });
	});
    }
}
