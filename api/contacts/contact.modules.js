const newId = (data) => data[data.length - 1].id + 1;

exports.newId = newId;

const targetContact = (contactsList) =>
  contactsList.find(({ id }) => id === parseInt(req.params.id));

exports.targetContact = targetContact;
