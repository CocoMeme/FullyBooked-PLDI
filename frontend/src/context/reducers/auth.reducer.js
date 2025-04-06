import { SET_CURRENT_USER } from "../actions/auth.action"
import isEmpty from "../../assets/common/is-empty"

export const initialState = {
    isAuthenticated: false,
    user: {},
    userData: null,
  };
  
export default function (state, action) {
    switch (action.type) {
        case SET_CURRENT_USER: 
        return {
            ...state,
            isAuthenticated: !isEmpty(action.payload.user),
            user: action.payload.user || {},
            userData: action.payload.userData
        };
        default:
            return state;
    }
}