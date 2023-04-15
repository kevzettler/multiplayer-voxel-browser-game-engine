import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import styles from '../styles/Equip.css';
import CharacterView from './CharacterView';
import ColorPalette from './ColorPalette';
import Header from '../Header';
import itemIndex from '../../items.json';
import { fetchLocalStoragePlayerData, Item, ItemMap } from '../../util/localStorage'

const initialState = fetchLocalStoragePlayerData()

function ItemCell(
  {item, itemMap, clickHandler}:
  {item: Item, itemMap: ItemMap, clickHandler: (itemMap:ItemMap) => void}
){
  let style = styles.itemCell

  if(itemMap[item.type] === item.guid){
    style += ` ${styles.selectedCell}`;
  }

  return (
    <div className={style}
         onClick={() => clickHandler({...itemMap, [item.type]: item.guid})}>
      {item.name}
    </div>
  );
}


export default function Equip(){
  const [userName, setuserName] = React.useState(initialState.userName);
  const [items, setItems] = React.useState(initialState.items);
  const [palette, setPalette] = React.useState(initialState.palette);
  const [error, setError] = React.useState(false);

  function onNameChange(event: React.FormEvent<HTMLInputElement>){
    //Debounce this or something
    let newName = event.currentTarget.value;

    setuserName(newName);
    if(newName === ''){
      setError(true);
    }else{
      if(error) setError(false);
      localStorage.setItem('userName', newName)
      setuserName(newName);
    }
  }

  function playLinkClickHandler(e: any){
    if(userName === ''){
      setError(true);
     return e.preventDefault();
   }

   return true;
 }

  console.log('rerendering Equip');
  return (
    <div>
      <Header/>
      <div className={styles.equipContent}>
        <table className={styles.nameInputTable}>
          <tbody>
            <tr>
              <td>
                <input
                  type="text"
                  placeholder="Enter Your Name"
                  onChange={onNameChange}
                  value={userName}
                  id="nameInput"
                  className={styles.nameInput}/>
                <label htmlFor="nameInput">Enter your name here </label>
              </td>
              <td>
                <a href="/play.html" onClick={playLinkClickHandler}>
                  <h2 style={{margin: "3px 0px 0px 10px", color:"green"}}>Click Here to Play! -&gt;</h2>
                </a>
                {error ?
                 <span style={{color: 'red'}}>Please enter a user name</span>
                : null}
              </td>
            </tr>
          </tbody>
        </table>

        <div className={styles.characterAndColorsContainer}>
          <div className={styles.characterViewContainer}>
            <CharacterView
              items={items}
              palette={palette}
              onItemsChange={(items) => localStorage.setItem('items', JSON.stringify(items))}
              onPaletteChange={(palette) => localStorage.setItem('palette', JSON.stringify(palette))}
            />
          </div>

          <div>
            <ColorPalette
              palette={palette}
              onChange={setPalette}
            />
          </div>
        </div>

        <div className={styles.equipmentListContainer}>
          <Tabs>
            <TabList>
              <Tab>Head</Tab>
              <Tab>Core</Tab>
              <Tab>Arms</Tab>
              <Tab>Legs</Tab>
              <Tab>Boost</Tab>
              <Tab>Tools</Tab>
            </TabList>
            <TabPanel>
              {Object.values(itemIndex).reduce((acc: JSX.Element[], item: Item) => {
                if(item.type === 'head'){
                  acc.push(
                    <ItemCell
                      key={`${item.type}${item.name}`}
                      item={item}
                      itemMap={items}
                      clickHandler={setItems}
                    />
                  );
                }
                return acc;
              }, [])}
            </TabPanel>
            <TabPanel>
              {Object.values(itemIndex).reduce((acc: JSX.Element[], item: Item) => {
                if(item.type === 'core'){
                  acc.push(
                    <ItemCell
                      key={`${item.type}${item.name}`}
                      item={item}
                      itemMap={items}
                      clickHandler={setItems}
                    />
                  );
                }
                return acc;
              }, [])}
            </TabPanel>
            <TabPanel>
              {Object.values(itemIndex).reduce((acc: JSX.Element[], item: Item) => {
                if(item.type === 'arms'){
                  acc.push(
                    <ItemCell
                      key={`${item.type}${item.name}`}
                      item={item}
                      itemMap={items}
                      clickHandler={setItems}
                    />
                  );
                }
                return acc;
              }, [])}
            </TabPanel>
            <TabPanel>
              {Object.values(itemIndex).reduce((acc: JSX.Element[], item: Item) => {
                if(item.type === 'legs'){
                  acc.push(
                    <ItemCell
                      key={`${item.type}${item.name}`}
                      item={item}
                      itemMap={items}
                      clickHandler={setItems}
                    />
                  );
                }
                return acc;
              }, [])}
            </TabPanel>
            <TabPanel>
              {Object.values(itemIndex).reduce((acc: JSX.Element[], item: Item) => {
                if(item.type === 'booster'){
                  acc.push(
                    <ItemCell
                      key={`${item.type}${item.name}`}
                      item={item}
                      itemMap={items}
                      clickHandler={setItems}
                    />
                  );
                }
                return acc;
              }, [])}
            </TabPanel>
            <TabPanel>
              {Object.values(itemIndex).reduce((acc: JSX.Element[], item: Item) => {
                if(item.type === 'weapon'){
                  acc.push(
                    <ItemCell
                      key={`${item.type}${item.name}`}
                      item={item}
                      itemMap={items}
                      clickHandler={setItems}
                    />
                  );
                }
                return acc;
              }, [])}
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
