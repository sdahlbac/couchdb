// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

couchTests.elixir = true;
couchTests.attachment_names = function(debug) {
  return console.log('done in test/elixir/test/attachment_names_test.exs');
  var db_name = get_random_db_name();
  var db = new CouchDB(db_name, {"X-Couch-Full-Commit":"false"}, {w: 3});
  db.createDb();
  if (debug) debugger;

  var goodDoc = {
    _id: "good_doc",
    _attachments: {
      "Колян.txt": {
       content_type:"application/octet-stream",
       data: "VGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHRleHQ="
      }
    }
  };

  var save_response = db.save(goodDoc);
  T(save_response.ok);

  var xhr = CouchDB.request("GET", "/" + db_name + "/good_doc/Колян.txt");
  T(xhr.responseText == "This is a base64 encoded text");
  T(xhr.getResponseHeader("Content-Type") == "application/octet-stream");
  TEquals("\"aEI7pOYCRBLTRQvvqYrrJQ==\"", xhr.getResponseHeader("Etag"));

  var binAttDoc = {
    _id: "bin_doc",
    _attachments:{
      "footxt": {
        content_type:"text/plain",
        data: "VGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHRleHQ="
      }
    }
  };

  // inline attachments
  resp = db.save(binAttDoc);
  TEquals(true, resp.ok, "attachment_name: inline attachment");


  // standalone docs
  var bin_data = "JHAPDO*AU£PN ){(3u[d 93DQ9¡€])}    ææøo'∂ƒæ≤çæππ•¥∫¶®#†π¶®¥π€ª®˙π8np";


  var xhr = (CouchDB.request("PUT", "/" + db_name + "/bin_doc3/attachmenttxt", {
    headers:{"Content-Type":"text/plain;charset=utf-8"},
    body:bin_data
  }));

  var resp = JSON.parse(xhr.responseText);
  TEquals(201, xhr.status, "attachment_name: standalone API");
  TEquals(true, resp.ok, "attachment_name: standalone API");

  // bulk docs
  var docs = { docs: [binAttDoc] };
  var xhr = CouchDB.request("POST", "/" + db_name + "/_bulk_docs", {
    body: JSON.stringify(docs)
  });

  TEquals(201, xhr.status, "attachment_name: bulk docs");


  // leading underscores
  var binAttDoc = {
    _id: "bin_doc2",
    _attachments:{
      "_foo.txt": {
        content_type:"text/plain",
        data: "VGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHRleHQ="
      }
    }
  };

  try {
    db.save(binAttDoc);
    TEquals(1, 2, "Attachment name with leading underscore saved. Should never show!");
  } catch (e) {
    TEquals("bad_request", e.error, "attachment_name: leading underscore");
    TEquals("Attachment name '_foo.txt' starts with prohibited character '_'", e.reason, "attachment_name: leading underscore");
  }

  // todo: form uploads, waiting for cmlenz' test case for form uploads
  // cleanup
  db.deleteDb();

};
