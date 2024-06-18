import { DatePicker, Divider, InputNumber, Modal, Table, Tree } from "antd";
import { isExternal } from "../helper/helpFunctions";
import { CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { doGetRequestAuth, doPostRequestAuth } from "../helper/RequestHelper";
import { useNavigate } from "react-router-dom";
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import locale from 'antd/es/date-picker/locale/de_DE';
import { myToastError, myToastSuccess } from "../helper/ToastHelper";

function generateTreeData(treeDataBuilder, inputString, headline, inputTitle, inputKey) {
  if (inputString && inputString !== "") {
    let inputSplit = inputString.split(',')
    treeDataBuilder.push({
      title: `${inputSplit.length} ${headline}`,
      key: inputKey,
      children: inputSplit.map((f) => ({
        title: `${inputTitle} # ${f}`,
        key: `${inputKey}#${f}`
      }))
    });
  }
}

function Home(props) {
  const [dataSource, setDataSource] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState();
  const [treeData, setTreeData] = useState([{ title: 'Auftrag', key: 'root' }]);
	const navigate = useNavigate();
  const dateFormat = 'DD.MM.YYYY';
  const [txtArbeitszeit, setTxtArbeitszeit] = useState();
  const [txtDate, setTxtDate] = useState(dayjs());


  function showModal(event) {
    setIsModalVisible(true);
    setCheckedKeys([]);
    setSelectedEntry(event);
    doGetRequestAuth('entry/'+event.key, props.token).then((res) => {

      let treeDataBuilder = [];

      generateTreeData(treeDataBuilder, res.data.flaschenFuellenNr, 'Flaschen füllen', 'Flasche', 'ff')
      generateTreeData(treeDataBuilder, res.data.flaschenTUEVNr, 'Flaschen TÜV', 'Flasche', 'ft')

      generateTreeData(treeDataBuilder, res.data.geraetePruefenNr, 'Geräte prüfen', 'Gerät', 'gp')
      generateTreeData(treeDataBuilder, res.data.geraeteReinigenNr, 'Geräte reinigen', 'Gerät', 'gr')

      generateTreeData(treeDataBuilder, res.data.laPruefenNr, 'LA prüfen', 'LA', 'lp')
      generateTreeData(treeDataBuilder, res.data.laReinigenNr, 'LA reinigen', 'LA', 'lr')

      generateTreeData(treeDataBuilder, res.data.maskenPruefenNr, 'Masken prüfen', 'Maske', 'mp')
      generateTreeData(treeDataBuilder, res.data.maskenReinigenNr, 'Masken reinigen', 'Maske', 'mr')

      setTreeData([{ title: `Auftrag # ${event.key}`, key: 'root', children: treeDataBuilder }])
    })
  };

  function handleOk() {
    console.log('Checked Keys:', checkedKeys.length);
    console.log('Checked Keys:', txtArbeitszeit, txtArbeitszeit === null, txtArbeitszeit === undefined);
    console.log('Checked Keys:', txtDate, txtDate===null);
    if(txtArbeitszeit === null || txtArbeitszeit === undefined || txtDate === null) {
      myToastError("Bitte Arbeitszeit und Datum füllen")
      return
    }
    if(checkedKeys.length === 0 ) {
      myToastError("Keine Arbeitspunkte ausgewählt")
      return
    }
    const params = { dataNo: selectedEntry.key, city: selectedEntry.cityNo, user: props.loggedPersNo, workingPoints: checkedKeys, dateWork: txtDate.format('YYYY-MM-DD'), timeWork: txtArbeitszeit};
    doPostRequestAuth('updateEntryTree', params, props.token).then(() => {
      myToastSuccess("Auftrag erfolgreich bearbeitet");
      doSearch()
      setIsModalVisible(false);
      setCheckedKeys([]);
      setTreeData([{ title: 'Auftrag', key: 'root' }]);
    });
  };

  function handleCancel() {
    setIsModalVisible(false);
    setCheckedKeys([]);
    setTreeData([{ title: 'Auftrag', key: 'root' }]);
  };

  function onCheck(checkedKeysValue) {
    setCheckedKeys(checkedKeysValue);
  };

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
      title: '#',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      render: (e) => e==='open'?'Offen':'Abgeschlossen'
    },
    {
      title: 'Feuerwehr',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'FeuerwehrNo',
      dataIndex: 'cityNo',
      key: 'cityNo',
      hidden: true
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
      render: (e) => isExternal(props.loggedFunctionNo) ? <EyeOutlined onClick={() => navigate('/planner/'+e.key)} /> : <CheckCircleOutlined onClick={() => showModal(e)}/>
    },
  ];
  return (
    <div>
      <Modal
        title={`${selectedEntry?.city} - ${selectedEntry?.dateWork}`}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Tree
          checkable
          showLine
          defaultExpandedKeys={['root']}
          onCheck={onCheck}
          checkedKeys={checkedKeys}
          treeData={treeData}
        />
        <InputNumber value={txtArbeitszeit} onChange={(e) => setTxtArbeitszeit(e)} min={0} max={10} decimalSeparator={","} className="ffInputFull" placeholder={"Arbeitszeit (h)"} style={{ marginTop: 16 }}/>
        <DatePicker locale={locale} format={dateFormat} value={txtDate} onChange={(e) => setTxtDate(e)} className="ffInputFull" style={{ marginTop: 16 }}/>
      </Modal>
      <p>Atemschutzpflegestelle Wemding</p>
      <Divider orientation="left">Aufträge</Divider>
      <Table scroll={{x: 400}} dataSource={dataSource} columns={columns} />
    </div>
  );
}

export default Home;
