var request = require("request"), 
cheerio = require("cheerio"),
moment = require("moment");

String.prototype.contains = function(it) { return this.indexOf(it) != -1; };
function isNotEmpty(object) {for(var i in object) { return true; } return false; }
function rfc3339(mmt) {return mmt.format("YYYY-MM-DDTHH:mm:ssZ");}

var BASE_URL = "https://pie.indiana.edu/apps/tcc/"
module.exports.login = login = function(username, password, callback) {
    if (!(username && password)) {
	return callback(new Error("Username/password empty"), null, null);
    }
    request.post({url:BASE_URL+"login.cfm",
                  form:{"Username":username,
                        "Password":password,
                        "submit":"Login"},
                  jar:true}, function(err, res, body) {
		      callback(err, res, body);
		  });
}
module.exports.subs = fetch = function(username, password, callback) {
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
		    console.log("-------------------------");
		    console.log({start:rfc3339(start), end:rfc3339(end), site:sub.site});
		   // start.zone(300);
		    //end.zone(300);
		    console.log({start:rfc3339(start), end:rfc3339(end), site:sub.site});
		    subs.push({start:rfc3339(start), end:rfc3339(end), site:sub.site});
		}
		
	    });
	    callback(subs);
	});
    });
}
module.exports.shifts = shifts = function(username, password, pie_username, callback) {
    login(username, password, function(err, res, body) {
	request.get({url:BASE_URL+"schedules/schedule.cfm", qs:{username:pie_username}, jar:true}, function(err, res, body) {
            var $ = cheerio.load(body);
	    $("td.iuCream").each(function(index, el) {
		var site = $(el).find("span:nth-of-type(2)").first().text();
		if (site.match(/\S/)) {
		    console.log(el.attribs.title, site);
		}
	    });
	});
    });
}
