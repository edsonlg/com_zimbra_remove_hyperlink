/**
# @license
# Zimbra Remove Hyperlinks Zimlet
# Copyright 2023 Sensum Sistemas de Informatica Ltda. 
# Edson L Girardi
# Ciro Ramos Santos
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 
#================================================================================================================
#
# This program is a derivative of original Zimlet and works differently from the original.
#
# Original project: 
# Zimbra Block Hyperlinks Zimlet
# https://github.com/yartu/zimlet-blockhyperlink
#
# Copyright 2016 Deltanoc Ltd.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
*/

function RemoveHyperlink() {
  com_zimbra_remove_hyperlink.settings = {};
  whiteListAddr = {};
}

// Makes the Zimlet class a subclass of ZmZimletBase.
RemoveHyperlink.prototype = new ZmZimletBase();
RemoveHyperlink.prototype.constructor = RemoveHyperlink;

// This method gets called by the Zimlet framework when the zimlet loads.
RemoveHyperlink.prototype.init = function () {
  com_zimbra_remove_hyperlink.version = this._zimletContext.version;
  AjxPackage.require({
    name: "MailCore",
    callback: new AjxCallback(this, this._applyRequestHeaders),
  });
  this.getWhiteBlackListRequest();
};

// This method called by the Zimlet framework when open new email message
RemoveHyperlink.prototype.onMsgView = function (msg, oldMsg, msgView) {
  this.getWhiteBlackListRequest();
  var container = msgView.getContentContainer();
  var html_content = container.innerHTML;
  var html_ret = container.innerHTML;
  var re = /<a\b[^>]*>([\s\S]*?)<\/a>/gm;
  var match;

  while ((match = re.exec(html_content))) {
    html_ret = html_ret.replace(
      match[0],
      this.replaceURLWithHTMLLinks(match[0])
    );
  }
  container.innerHTML = html_ret;
  return true;
};

// Get WhiteBlackList from Zimbra
RemoveHyperlink.prototype.getWhiteBlackListRequest = function () {
  var jsonObj = { GetWhiteBlackListRequest: { _jsns: "urn:zimbraAccount" } };
  var params = {
    jsonObj: jsonObj,
    asyncMode: true,
    callback: new AjxCallback(this, this.getWhiteBlackListRequestHandler),
  };
  return appCtxt.getAppController().sendRequest(params);
};

// Handler to getWhiteBlackListRequest
RemoveHyperlink.prototype.getWhiteBlackListRequestHandler = function (result) {
  if (result.isException()) {
    var exception = result.getException();
    console.log(exception);
    return;
  }
  var response = result.getResponse().GetWhiteBlackListResponse;
  this.whiteListAddr = response.whiteList[0].addr;
};

// This method replace <a> tag href with ajax function
RemoveHyperlink.prototype.replaceURLWithHTMLLinks = function (text) {
  var el = document.createElement("html");
  el.innerHTML = text;
  var oAnchor = el.getElementsByTagName("a")[0];
  var old_url_href = String(el.getElementsByTagName("a")[0]);

  if (!old_url_href) {
    return text;
  }

  var ok = Boolean(false);
  var domain = this.getDomain(old_url_href);

  // For compatibility with older versions of JavaScript
  for (var element in this.whiteListAddr) {
    var onlyDomain = this.getDomain(
      "https://" + this.whiteListAddr[element]._content + "/"
    );
    if (domain == onlyDomain) {
      ok = true;
    } else {
      //console.log(onlyDomain);
    }
  }

  if (ok === false) {
    //console.log("URL removed: " + old_url_href);
    return oAnchor.innerHTML;
  } else {
    //console.log("URL released: " + old_url_href);
    return text;
  }
};

// Get Domain from URL
// Function derived from an answer posted on:
// https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string/16934798#16934798
RemoveHyperlink.prototype.getDomain = function (url) {
  //console.log("URL: " + url);
  parsed_url = {};

  if (url == null || url.length == 0) return parsed_url;

  protocol_i = url.indexOf("://");
  parsed_url.protocol = url.substr(0, protocol_i);

  remaining_url = url.substr(protocol_i + 3, url.length);
  domain_i = remaining_url.indexOf("/");
  domain_i = domain_i == -1 ? remaining_url.length - 1 : domain_i;
  parsed_url.domain = remaining_url.substr(0, domain_i);
  parsed_url.path =
    domain_i == -1 || domain_i + 1 == remaining_url.length
      ? null
      : remaining_url.substr(domain_i + 1, remaining_url.length);

  domain_parts = parsed_url.domain.split(".");
  var countDots = domain_parts.length;
  var isDotCom = domain_parts[countDots - 1];
  if (isDotCom.length == 3) {
    parsed_url.subdomain = null;
    parsed_url.host = domain_parts[countDots - 2];
    parsed_url.tld = domain_parts[countDots - 1];
  } else {
    parsed_url.subdomain = null;
    parsed_url.host = domain_parts[countDots - 3];
    parsed_url.tld =
      domain_parts[countDots - 2] + "." + domain_parts[countDots - 1];
  }
  parsed_url.parent_domain = parsed_url.host + "." + parsed_url.tld;
  return parsed_url.parent_domain;
};

// This method fires if server side extension find an url
RemoveHyperlink.prototype.match = function (line, startIndex) {
  var re =
    /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)\S+(?:[^\s`!\[\]{};:'".,?«»“”‘’]))/gi;
  re.lastIndex = startIndex;
  var match = re.exec(line);
  if (match) {
    return match;
  } else return null;
};
