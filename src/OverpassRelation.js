var util = require('util')
var OverpassObject = require('./OverpassObject')

util.inherits(OverpassRelation, OverpassObject)
function OverpassRelation() {
  OverpassObject.call(this);
}

OverpassRelation.prototype.update_data = function(data, request) {
  this.constructor.super_.prototype.update_data.call(this, data, request)
}

OverpassRelation.prototype.member_ids = function() {
  if(this._member_ids)
    return this._member_ids;

  if(typeof this.data.members == 'undefined')
    return null

  this._member_ids = [];
  for(var i = 0; i < this.data.members.length; i++) {
    var member = this.data.members[i];

    this._member_ids.push(member.type.substr(0, 1) + member.ref);
  }

  return this._member_ids;
}

module.exports = OverpassRelation
