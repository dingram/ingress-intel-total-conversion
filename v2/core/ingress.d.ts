declare var PLAYER: {
  ap: string;
  available_invites: number;
  energy: number;
  level: number;
  min_ap_for_current_level: string;
  min_ap_for_next_level: string;
  nickMatcher: RegExp;
  nickname: string;
  team: string;
  verified_level: number;
  xm_capacity: string;
};

interface Window {
  IS_VERSION_MOBILE: boolean;
  IS_DEVICE_TABLET: boolean;
  IS_DEVICE_MOBILE: boolean;
}
