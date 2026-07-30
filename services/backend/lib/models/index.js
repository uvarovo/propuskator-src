import AdminUser                     from './AdminUser';
import User                          from './User';
import Workspace                     from './Workspace';
import AccessCamera                  from './AccessCamera';
import AccessSubjectToken            from './AccessSubjectToken';
import AccessReadersGroup            from './AccessReadersGroup';
import AccessTokenReader             from './AccessTokenReader';
import AccessSubject                 from './AccessSubject';
import AccessSchedule                from './AccessSchedule';
import AccessScheduleDate            from './AccessScheduleDate';
import AccessSetting                 from './AccessSetting';
import AccessLog                     from './AccessLog';
import Notification                  from './Notification';
import AccessTokenToReaderChangesMap from './AccessTokenToReaderChangesMap';
import SettingToSubjectMap           from './mappings/SettingToSubjectMap';
import SettingToScheduleMap          from './mappings/SettingToScheduleMap';
import SettingToReaderMap            from './mappings/SettingToReaderMap';
import SettingToGroupMap             from './mappings/SettingToGroupMap';
import GroupToReaderMap              from './mappings/GroupToReaderMap';
import MobileGroupToReaderMap        from './mappings/MobileGroupToReaderMap';
import MqttUser                      from './MqttUser';
import MqttAcl                       from './MqttAcl';
import UserAccessTokenReader         from './UserAccessTokenReader';
import ReportedIssue                 from './ReportedIssue';
import StoredTriggerableAction       from './StoredTriggerableAction';
import AccessReadersMobileGroup      from './AccessReadersMobileGroup';
import ReaderDisplayedTopic          from './ReaderDisplayedTopic';
import UserRegistrationRequest       from './UserRegistrationRequest.js';

const models = {
    Workspace,
    AdminUser,
    User,
    AccessCamera,
    AccessSubjectToken,
    AccessReadersGroup,
    AccessTokenReader,
    GroupToReaderMap,
    AccessSubject,
    AccessSchedule,
    AccessScheduleDate,
    AccessSetting,
    SettingToSubjectMap,
    SettingToScheduleMap,
    SettingToReaderMap,
    SettingToGroupMap,
    AccessLog,
    Notification,
    AccessTokenToReaderChangesMap,
    MqttUser,
    MqttAcl,
    UserAccessTokenReader,
    ReportedIssue,
    StoredTriggerableAction,
    MobileGroupToReaderMap,
    AccessReadersMobileGroup,
    ReaderDisplayedTopic,
    UserRegistrationRequest
};

for (const Model of Object.values(models)) {
    Model.initRelationsAndHooks();
}

export default models;
