import React from "react";

import MainLayout from "../layouts/MainLayout";
import TaskList from "../components/TasksList";
import { withApollo } from "../lib/apollo";

const Index = () => {
  return (
    <MainLayout>
      <TaskList />
    </MainLayout>
  );
};

export default withApollo(Index);
