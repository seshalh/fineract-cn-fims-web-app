/**
 * Copyright 2017 The Mifos Initiative.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {Injectable} from '@angular/core';
import * as fromCustomers from '../store';
import {Observable} from 'rxjs/Observable';
import {of} from 'rxjs/observable/of';
import {CustomersStore} from '../store/index';
import {CustomerService} from '../../services/customer/customer.service';
import {ExistsGuardService} from '../../common/guards/exists-guard';
import {LoadAction} from '../store/tasks/task.actions';

@Injectable()
export class TaskExistsGuard implements CanActivate {

  constructor(private store: CustomersStore,
              private customerService: CustomerService,
              private existsGuardService: ExistsGuardService) {
  }

  hasTaskInStore(id: string): Observable<boolean> {
    const timestamp$: Observable<number> = this.store.select(fromCustomers.getTaskLoadedAt)
      .map(loadedAt => loadedAt[id]);

    return this.existsGuardService.isWithinExpiry(timestamp$);
  }

  hasTaskInApi(id: string): Observable<boolean> {
    const getTask$: Observable<any> = this.customerService.getTask(id)
      .map(taskEntity => new LoadAction({
        resource: taskEntity
      }))
      .do((action: LoadAction) => this.store.dispatch(action))
      .map(task => !!task);

    return this.existsGuardService.routeTo404OnError(getTask$);
  }

  hasTask(id: string): Observable<boolean> {
    return this.hasTaskInStore(id)
      .switchMap(inStore => {
        if (inStore) {
          return of(inStore);
        }
        return this.hasTaskInApi(id);
      });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.hasTask(route.params['id']);
  }
}
