import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import Equip from './ui/Equip/Equip';
import Champions from './ui/Champions';
import "./ui/styles/Root.css";

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/equip" component={Equip} />
      <Route path="/champions" component={Champions} />
      <Redirect path="/" to="/equip" />
    </Switch>
  </Router>,
  document.body
);
