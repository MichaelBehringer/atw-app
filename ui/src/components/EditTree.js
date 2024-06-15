import React, { useState } from 'react';
import { Tree, Modal, Button, Input } from 'antd';
import { doGetRequestAuth } from '../helper/RequestHelper';

function generatetreeData(treeDataBuilder, inputString, headline, inputTitle, inputKey) {
  if(inputString && inputString !== "") {
    let inputSplit = inputString.split(',')
    treeDataBuilder.push({
        title: `${inputSplit.length} ${headline}`,
        key: inputKey,
        children: inputSplit.map((f) => ({
            title: `${inputTitle} ${f}`,
            key: `${inputKey}#${f}`
        }))
    });
}
}

function AntdTransferTree (props) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [treeData, setTreeData] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
    doGetRequestAuth('entry/777', props.token).then((res) => {
      console.log(res);
      let treeDataBuilder = [];

      generatetreeData(treeDataBuilder, res.data.flaschenFuellenNr, 'Flaschen füllen', 'Flasche', 'ff')
      generatetreeData(treeDataBuilder, res.data.flaschenTUEVNr, 'Flaschen TÜV', 'Flasche', 'ft')
      
      generatetreeData(treeDataBuilder, res.data.geraetePruefenNr, 'Geräte prüfen', 'Gerät', 'gp')
      generatetreeData(treeDataBuilder, res.data.geraeteReinigenNr, 'Geräte reinigen', 'Gerät', 'gr')
      
      generatetreeData(treeDataBuilder, res.data.geraetePruefenNr, 'LA prüfen', 'LA', 'lp')
      generatetreeData(treeDataBuilder, res.data.geraeteReinigenNr, 'LA reinigen', 'LA', 'lr')
      
      generatetreeData(treeDataBuilder, res.data.geraetePruefenNr, 'Masken prüfen', 'Maske', 'mp')
      generatetreeData(treeDataBuilder, res.data.geraeteReinigenNr, 'Masken reinigen', 'Maske', 'mr')
      
      setTreeData(treeDataBuilder)
    })
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onSelect = (selectedKeys, info) => {
    console.log('selected', selectedKeys, info);
  };

  const onCheck = (checkedKeys, info) => {
    console.log('onCheck', checkedKeys, info);
  };

  return (
    <div>
      <Button type="primary" onClick={showModal}>
        Open Modal
      </Button>
      <Modal
        title="Tree and Inputs"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Tree
          checkable
          onSelect={onSelect}
          onCheck={onCheck}
          treeData={treeData}
          defaultCheckedKeys={['ft#9']}
        />
        <Input placeholder="Text Field 1" style={{ marginTop: 16 }} />
        <Input placeholder="Text Field 2" style={{ marginTop: 16 }} />
      </Modal>
    </div>
  );
};

export default AntdTransferTree;
