"use client";
import React from "react";
import Layout from "../layout/Layout";
import SuppliersSlider from "../components/SuppliersSlider";
import HeaderSlider from "../components/HeaderSlider";
import Trajectory from "../components/Trajectory";
import OurServices from "../components/OurServices";

const Home = () => {
  return (
    <Layout>
      <HeaderSlider />
      <SuppliersSlider />
      <div className="my-16">
        <Trajectory />
      </div>
      <OurServices />
    </Layout>
  );
};

export default Home;
