import {
  getDate,
  getDateString,
  getLogDateFormat,
  getTimeString,
} from '../../utils/date.utils';

describe('date utility test', () => {
  test('coba', () => {
    const time = '06:23';
    console.log(time);
    console.log(getDate(time));

    const date = '2024-05-21';
    console.log(date);
    console.log(getDate(date));

    console.log(getDate('1970-01-01T06:23:00.000Z'));
  });

  test('coba2', () => {
    const localFile = /\d{4}-\d{2}-\d{2}/;
    console.log(localFile.test('001230045600701_2024-01-01.png'));
    console.log(localFile.test('001230045600701_2024-01-01.jpg'));
    console.log(localFile.test('001230045600701_2024-01-01.jpeg'));
    console.log(localFile.test('001230045600701_2024-1-01.jpeg'));
    console.log(localFile.test('sdklajfsjkfjsdkjfsdkfjasf'));
  });
});