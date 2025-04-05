import { SET_CURRENT_USER } from "../actions/auth.action"
import isEmpty from "../../assets/common/is-empty"

// Define the initial state
const initialState = {
    isAuthenticated: false,
    user: {},
    userProfile: null,
  };


export default function (state, action) {
    switch (action.type) {
        case SET_CURRENT_USER: 
        return {
            ...state,
            isAuthenticated: !isEmpty(action.payload),
            user: action.payload,
            userProfile: action.userProfile
        };
        default:
            return state;
    }
}