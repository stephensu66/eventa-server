export const normalizeTypeFields = (result, fields) => {
  return result.map(item => {
    const newResult = { ...item };
    for (const field of fields) {
      if (field in newResult && field !== 'event_type') {
        newResult[field] = Boolean(newResult[field]);
      }
      if (field === 'event_type') {
        switch (newResult[field]) {
          case 1:
            newResult[field] = 'event';
            break;
          case 2:
            newResult[field] = 'skill';
            break;
          case 3:
            newResult[field] = 'task';
            break;
          default:
            break;
        }
      }
    }
    return newResult;
  });
}