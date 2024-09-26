import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class LogbookService {
  async handlePostLogbook() {
    throw new NotImplementedException();
  }

  async handleGetLogbook() {
    throw new NotImplementedException();
  }

  async handleUpdateLogbook() {
    throw new NotImplementedException();
  }
}
