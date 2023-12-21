import { Divider, Table } from "antd";
import { isExternal } from "../helper/helpFunctions";
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { doPostRequestAuth } from "../helper/RequestHelper";
import { myToastError } from "../helper/ToastHelper";

function Home(props) {
  const [dataSource, setDataSource] = useState([]);

  function doSearch() {
    const params = {persNo: props.loggedPersNo, isExternal: isExternal(props.loggedFunctionNo)};
    doPostRequestAuth("searchOpen", params, props.token).then((res) => {
      setDataSource(res.data);
    });
  }

  useEffect(() => {
    doSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    {
      title: 'Feuerwehr',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'Datum',
      dataIndex: 'dateWork',
      key: 'dateWork',
    },
    {
      title: '',
      dataIndex: '',
      key: 'x',
      render: (e) => isExternal(props.loggedFunctionNo) ? <EditOutlined onClick={() => console.log(e)} /> : <CheckCircleOutlined onClick={() => myToastError("TODO")}/>
    },
  ];
  return (
    <div>
      <p>Atemschutzpflegestelle Wemding</p>
      <Divider orientation="left">Aufträge</Divider>
      <Table scroll={{x: 400}} dataSource={dataSource} columns={columns} />
    </div>
  );
}

export default Home;
