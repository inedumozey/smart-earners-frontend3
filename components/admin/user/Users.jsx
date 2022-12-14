import { useState, useEffect } from "react";
import styled from 'styled-components';
import {useSelector, useDispatch} from 'react-redux';
import Loader_ from "../loader/Loader";
import {useSnap} from '@mozeyinedu/hooks-lab'
import { blockUser, getUsers, getUser, payusers, resetAuth, deleteUser, unBlockUser, makeAdmin, removeAdmin } from "../../../redux/auth/auth";
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Spinner from "../../../loaders/Spinner";
import filter from "@mozeyinedu/filter";
import { getConfig } from "../../../redux/admin/web_config";
import SearchIcon from '@mui/icons-material/Search';
import Cookies from "js-cookie";
import { resolveApi } from "../../../utils/resolveApi";
import conversionRate from "../../../utils/conversionRate";
import { toast } from 'react-toastify';

import {
  AdminWrapper,
  Header_Table,
  Table
} from "../styles";
import PopUpModal from "../../modals/popUpModal/PopUpModal";

export default function Users({userInfo}) {
  const {snap} = useSnap(.5)

  const dispatch = useDispatch()
  const state = useSelector(state=>state);
  const [isLoading, setLoading] = useState(true)
  const {users, user, del, block, payUsers, unblock, makeadmin, removeadmin} = state.auth;
  const {config} = state.config;
  const [ready, setReady] = useState(true)

  const [investor, setInvestor] = useState(0);
  const [balance, setBalance] = useState(0)
  const [admin, setAdmin] = useState(0);
  const [inp, setInp] = useState('');
  const [filteredData, setFilter] = useState(users.data);
  const num = 100
  const [count, setCount] = useState(num);
  const [opening, setOpening] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [payingPending, setPayingPending] = useState(false);
  const [selectedUser, setSelectedUser] = useState('')

  const month = ['Jan', 'Feb','Mar', 'Apr', 'May', 'Jun', 'Jul','Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

  useEffect(()=>{
    dispatch(resetAuth())
  }, [users, user, del, block, payUsers, unblock, makeadmin, removeadmin])
 
  useEffect(()=>{
    let sum = 0;
    for(let i=0; i<users.data.length; i++){
      if(users.data[i].hasInvested){
        sum = sum + 1
      }
    }
    setInvestor(sum)

    let bal = 0;
    for(let i=0; i<users.data.length; i++){
      bal = bal + users.data[i].amount
    }
    setBalance(bal)

    
    let ad = 0;
    for(let i=0; i<users.data.length; i++){
      if(users.data[i].isAdmin || users.data[i].isPrimaryAdmin){
        ad = ad + 1
      }
    }
    setAdmin(ad)
    
  }, [users])

  useEffect(()=>{
    const newData = filter({
      data: users.data,
      keys: [ "username", "email", "amount", "createdAt", "updatedAt", "accountNumber"],
      input: inp
    })

    setFilter(newData)

  }, [inp, users])

  
  useEffect(()=>{
    dispatch(getUsers())
    dispatch(getUser())
    dispatch(getConfig())

    setTimeout(()=>{
      users.isLoading && user.isLoading && config.isLoading ? setLoading(true) : setLoading(false)
    }, 1000)

    // users.isLoading && user.isLoading && config.isLoading ? setLoading(true) : setLoading(false)
  }, [])
  // conversionRate
  // nativeCurrency
  // tradeCurrency

  // delete user
  const handleDelete = async(id)=>{
    if(!Cookies.get('accesstoken')){
      await resolveApi.refreshTokenClinetSide()
    }
    dispatch(deleteUser(id))
  }
  
    // block user
  const handleBlock = async(id, isBlock)=>{
    if(!Cookies.get('accesstoken')){
      await resolveApi.refreshTokenClinetSide()
    }
    isBlock ?  dispatch(unBlockUser(id)) :  dispatch(blockUser(id))
  }

    // make user admin/remove admin
  const handleAdmin = async(id, isAdmin)=>{
    if(!Cookies.get('accesstoken')){
      await resolveApi.refreshTokenClinetSide()
    }
    isAdmin ?  dispatch(removeAdmin(id)) :  dispatch(makeAdmin(id))
  }
  
  useEffect(()=>{
    setTimeout(()=>{
      setReady(false)
    }, 2000)
  }, [])

  // click more to view more
  const handleViewMore =()=>{
    setOpening(true)

    setTimeout(()=>{
      setOpening(false)
      setCount(prevState=>prevState + num)
    }, 1000)
  }

  // handle pay users
  const showPayModal =(user)=>{
    setSelectedUser(user);
    setShowModal(true)
  }

  const payInitialState = {
    amount: '',
    action: ''
  }
  const [payInp, setPayInp] = useState(payInitialState);
  const [userMsg, setUserMsg] = useState({status: true, msg:''});
  const [showPayMsg, setShowPayMsg] = useState(false);

  const getInp =(e)=>{
      const {name, value}= e.target;
      setPayInp({...payInp, [name]:value});
  }

  useEffect(()=>{
    if(payInp.amount && payInp.action){
        if(payInp.action == 'remove'){

          const resultAmount = Number(selectedUser.amount) - Number(payInp.amount);
          if(selectedUser.amount < payInp.amount) {
            setUserMsg({status: false, msg: `Insufficient Balance (${resultAmount} ${selectedUser.currency} )`})
          }
          else{
            setUserMsg({status: true, msg: `New Balance is ${resultAmount} ${selectedUser.currency}`})
          }
        }

        else if (payInp.action == 'add'){
          const resultAmount = Number(selectedUser.amount) + Number(payInp.amount);
          setUserMsg({status: true, msg: `New Balance is ${resultAmount} ${selectedUser.currency}`})
        }
    }
    payInp.amount ? setShowPayMsg(true) : setShowPayMsg(false)

  }, [payInp.amount, payInp.action])


  const handlePayUser =async(e)=>{
    e.preventDefault()
    setPayingPending(true)
    const data = {
      id: selectedUser._id,
      amount: payInp.amount,
      action: payInp.action
    }
  
    if(!Cookies.get('accesstoken')){
      await resolveApi.refreshTokenClinetSide()
      setTimeout(()=>{
        dispatch(payusers(data))
      }, 500)
    }
    else{
      dispatch(payusers(data))
    }
  }

  useEffect(()=>{
    if(payUsers.msg){
      setPayingPending(false)
      toast(payUsers.msg, {
        type: payUsers.status ? 'success' : 'error'
      })         
    }

    if(payUsers.status){
      setPayInp(payInitialState)
      setShowModal(false);
      setUserMsg({msg: '', status: true})
      setSelectedUser('')
    }
  }, [payUsers])

  useEffect(()=>{
    if(!showModal){
      setPayInp(payInitialState);
      setPayingPending(false)
      setUserMsg({msg: '', status: true});
      setSelectedUser('')
    }
  }, [showModal])

  return (
    <>
    { //check if user exist
      isLoading ?  <Loader_ /> :
      (
        ready ? <div style={{display: 'flex', justifyContent: 'center'}}><Spinner size="25px"/></div> :
      (
        <>
          <Header_Table>
            <div className="row">
            <div className="search">
                <input
                  type="text"
                  placeholder="Search by username, email, amount"
                  value={inp || ''}
                  onChange={(e)=>setInp(e.target.value)}
                />
                <div className="icon"><SearchIcon /></div>
            </div>
            </div>
            <div className="row">
              <div>Total members: <span style={{fontWeight: 'bold'}}>{isLoading ? '---' : users.data.length }</span></div>
              <div>Total Investors: <span style={{fontWeight: 'bold'}}>{isLoading ? '---' : investor}</span></div>
              <div>Overall Balance: <span style={{fontWeight: 'bold'}}>{isLoading ? '---' : balance.toFixed(4)} {config.data.nativeCurrency}</span></div>
              <div>Admin: <span style={{fontWeight: 'bold'}}>{isLoading ? '---' : admin}</span></div>
            </div>
          </Header_Table>
          {
             users.data.length < 1 ? <Msg /> :
             (
               <AdminWrapper>
                 <div style={{display: 'flex', justifyContent: 'center'}}>
                   {
                     (function(){
                       if(del.isLoading || block.isLoading || unblock.isLoading || makeadmin.isLoading || removeadmin.isLoading){
                         return <Spinner size='1.5rem' />
                       }else{
                         return ''
                       }
                     }())
                   }
                 </div>
                 <Table>
                 <table>
                       <thead>
                         <tr>
                           <th>S/N</th>
                           <th>Date</th>
                           <th>Email</th>
                           <th>Username</th>
                           <th>Role</th>
                           <th>Balance {`(${config.data.nativeCurrency})`}</th>
                           <th>Balance {`(${config.data.tradeCurrency})`}</th>
                           <th>Investor</th>
                           <th>AC/No</th>
                           <th>Verified</th>
                           <th>Blocked</th>
                           <th>Delete</th>
                           <th>Pay Users</th>
                         </tr>
                       </thead>
                       <tbody>
                         {filteredData.slice(0, count).map((user, i)=>{
                           return (
                             <tr key={user._id}>
                               <td>{i+1}</td>
                               <td>
                                 {user.createdAt && new Date(user.createdAt).toLocaleString()}
                               </td>
                               <td>{user.email}</td>
                               <td>{user.username}</td>
                               <td onClick={()=>handleAdmin(user._id, user.isAdmin)} style={{cursor: 'pointer', fontWeight: 'bold', color: user.isAdmin ? 'green' : 'var(--major-color-purest)'}}>
                                 {
                                   (function(){
                                     if(user.isAdmin && !user.isPrimaryAdmin){
                                       return 'Admin'
                                     }
                                     else if(user.isPrimaryAdmin && user.isAdmin){
                                       return 'Primary Admin'
                                     }
                                     else{
                                       return 'User'
                                     }
                                   }())
                                 }
                               </td>
                               <td>{user.amount && user.amount.toFixed(4)}</td>
                               <td>{user.amount && conversionRate.SEC_TO_USD(user.amount, config.data.conversionRate).toFixed(4)}</td>
                               <td>{user.hasInvested ? 'True' : 'False'}</td>
                               <td>{user.accountNumber}</td>
                               <td>{user.isVerified ? <VerifiedUserIcon style={{fontSize: '1rem', color: "var(--bright-color"}}/> : ''}</td>
                               <td onClick={()=>handleBlock(user._id, user.isBlocked)} style={{cursor: 'pointer', fontWeight: 'bold', color: user.isBlocked ? '#c20' : 'var(--major-color-purest)'}}>
                                 {
                                   user.isBlocked ? "Unblock" : "Block"
                                 }
                               </td>
         
                               <td onClick={()=>handleDelete(user._id)} style={{cursor: 'pointer', fontWeight: 'bold', color: '#c20'}}>Remove</td>

                               <td {...snap()} onClick={()=>showPayModal(user)} style={{cursor: 'pointer', userSelect: 'none', fontWeight: 'bold', color: '#0f0', background: 'var(--major-color-purest'}}>Pay</td>
                             </tr>
                           )
                         })}
                       </tbody>
                 </table>
                 </Table>

                  {
                    count >= filteredData.length ? '' :
                    <ViewMore>
                      {
                        opening ? <div> <Spinner size="20px"/></div> : ''
                      }
                      <div onClick={handleViewMore} className="more" {...snap()}>View More...</div>
                    </ViewMore>
                  }

                <PopUpModal title={`Paying ${selectedUser.username}`} showModal={showModal} setShowModal={setShowModal}>
                  <div
                    style={{
                      width: '80vw',
                      maxWidth: '400px',
                      padding: '20px',
          
                    }}>
            
                    <div style={{textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '.9rem'}}>
                    {`${selectedUser.username}'s Current Balance: ${selectedUser.amount} ${selectedUser.currency}`}
                    </div>

                    <PayUserForm onSubmit={handlePayUser}>
                      {payingPending ? <div style={{display: 'flex', justifyContent: 'center'}}><Spinner size="20px" /></div> : ''}

                      {
                        showPayMsg ? 
                        (
                          <div style={{display: 'flex', justifyContent: 'center', color: userMsg.status ? 'var(--major-color-purest)' : '#c20'}}>{userMsg.msg}</div>
                        ) : ''
                      }

                      <div style={{
                        width: '100%',
                        marginBottom: '3px',
                        display: 'flex',
                        justifyContent: 'space-around'
                      }}>
                        <input
                          style={{width: 'calc(100% - 100px)', padding: '7px 15px'}}
                          placeholder="Amount SEC"
                          type="number"
                          name="amount"
                          value={payInp.amount || ""}
                          onChange={getInp}
                        />
                        <select
                          name="action"
                          onChange={getInp}
                          style={{width: '100px', padding: '7px'}}>
                            <option value="">--Action--</option>
                            <option value="add">Add</option>
                            <option value="remove">Remove</option>
                        </select>
                        
                      </div>
                      <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-around'
                      }}>
                        <input
                          style={{width: '100%', padding: '7px', background: 'var(--major-color-purest'}}
                          type="submit"
                          value={payingPending ? "Loading..." : "Submit"}
                          disabled={payInp.action=='remove' && (selectedUser.amount < payInp.amount)}
                        />
                      </div>
                    </PayUserForm>
                  </div>
                </PopUpModal>
               </AdminWrapper>
             )
          }
        </>
      )
      )
    }
    </>
  )
}



const Msg = ()=>{

  return (
    <MsgWrapper className="none">
      No Users At The Moment
    </MsgWrapper>
  )
}


const MsgWrapper = styled.div`
width: 70%;
max-width: 400px;
padding: 10px;
font-size: .8rem;
text-align: center;
margin: 10px auto;
// box-shadow: 2px 2px 4px #aaa, -2px -2px 4px #aaa;
`

const ViewMore = styled.div`
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;

 .more{
   user-select: none;
   -webkit-user-select: none;
   font-size: .7rem;
   cursor: pointer;
   border: 1px solid;
   border-radius: 5px;
   padding: 7px;

   &:hover{
     opacity: .4
   }
 }
`

const PayUserForm = styled.form`
  input, select{
    border: 1px solid #ccc;

    &:focus{
      outline: none;
      border: 2px solid green;
    }

    &[type="submit"]{
      color: #fff;
      background: var(--major-color-purest);
      cursor: pointer;
    }
  }
`