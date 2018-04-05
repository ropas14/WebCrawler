 let request = require('request');
 let cheerio = require('cheerio');
 let URL = require('url-parse');
 let start_url = "https://www.startupschool.org/presentations/vertical/agriculture-agtech?course=1";
 let orgUrl = "https://www.startupschool.org/";
 const MAX_PAGES_TO_VISIT = 300;
 let pagesVisited = {};
 let AllLinks = [];
 let pagesUrls = [];
 let numPagesVisited = 0;
 let pagesToVisit = [];
 let url = new URL(start_url);
 let baseUrl = url.protocol + "//" + url.hostname;
 let item = {
   urls: "",
 };
 let MongoClient = require('mongodb').MongoClient
 const mongourl = "mongodb://localhost:27017/StartUpSchool"
 pagesToVisit.push(start_url);
 crawl();

 function crawl() {
   if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
     console.log("All pages required have been visited.");
     Promise.all(AllLinks).then(function(values) {
       printAll();
     });
     return;
   }
   let nextPage = pagesToVisit.pop();
   if (nextPage in pagesVisited) {
     // We've already visited this page, so repeat the crawl
     crawl();
   }
   else {
     // New page we haven't visited	
     visitPage(nextPage, crawl);
   }
 }
 var errHandler = function(err) {
   console.log(err);
   callback();
 }

 function visitPage(url, callback) {
   // Add page to our set
   pagesVisited[url] = true;
   numPagesVisited++;
   // Make the request
   console.log("Visiting page " + url);
   let pageReq = pageRequest(url, callback);
   AllLinks.push(pageReq);
   pageReq.then(function(body) {
       let $ = cheerio.load(body);
       collectLinks($);
       callback();
     }, errHandler)
     .catch(error => {
       console.dir(error);
       throw error;
     });
 }

 function pageRequest(url, callback) {
   return new Promise(function(resolve, reject) {
     // Asynchronous request and callback
     request.get(url, function(error, response, body) {
       if (error) {
         reject(error);
         callback();
       }
       else {
         resolve(body);
       }
     })
   })
 }

 function collectInternalLinks($) {
   let relativeLinks = $("a[href^='/']");
   console.log("Found " + relativeLinks.length + " relative links on page");
   relativeLinks.each(function() {
     const sublink = baseUrl + relativeLinks;
     console.log(sublink);
     // avoiding protected links
     if (sublink.indexOf("email-protection#") == -1) PagestoVisit.push(sublink);
   });
   collectLinks($);
 }

 function collectLinks($) {
   let relativeLinks = $("a");
   relativeLinks.each(function() {
     let link = $(this).attr('href');
     if (link == null) {
       return;
     }
     if (link.startsWith("/")) {
       link = baseUrl + link;
       if (link in pagesVisited) {}
       else {
         if (link.indexOf("email-protection#") == -1) pagesToVisit.push(baseUrl + $(this).attr('href'));
       }
     }
     if (link in pagesUrls) {
       // do nothing
     }
     else {
       if (link.indexOf("email-protection#") == -1) {
         pagesUrls.push(link);
         item.urls = link;
         let item_sources = item;
         saveData(item_sources);
       }
     }
   });
 }

 function printAll() {
   console.log(pagesUrls.length);
 }

 function saveData(value) {
   MongoClient.connect(mongourl, function(err, db) {
     if (err) throw err;
     const dbo = db.db("StartUpSchool");
     const myobject = {
       locations: value,
     }
     dbo.collection("siteURLs").insertOne(myobject, function(err, res) {
       if (err) throw err;
       db.close();
     });
   });
 }