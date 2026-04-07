const parseAndCalculateAge = (dateInput) => {
  if (!dateInput) {
    return { dateOfBirth: null, age: null, error: null };
  }

  const dob = new Date(dateInput);
  if (Number.isNaN(dob.getTime())) {
    return { dateOfBirth: null, age: null, error: 'Invalid date of birth' };
  }

  const today = new Date();
  const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (dobDateOnly > todayDateOnly) {
    return { dateOfBirth: null, age: null, error: 'Date of birth cannot be in the future' };
  }

  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return {
    dateOfBirth: dobDateOnly,
    age,
    error: null,
  };
};

module.exports = { parseAndCalculateAge };
