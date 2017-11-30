(function () {
  'use strict'

  var $ = s => document.querySelector(s)
  var $$ = s => document.querySelectorAll(s)
  var show = el => { if (el) el.classList.remove('hidden')}
  var hide = el => { if (el) el.classList.add('hidden') }

  var apiURL = location.origin
  var token = localStorage.getItem('token')
  var types = []
  var items = []
  var stocks = []

  var $login = $('#login')
  var $addEditItem = $('#addEditItem')
  var $addEditTitle = $('#addEditTitle')
  var $addEditItemBtn = $('#addEditItemBtn')
  var $items = $('#items')
  var $typeId = $('[name="typeId"]')
  var $itemForm = $('#itemForm')
  var $addStock = $('#addStock')
  var $sellItem = $('#sellItem')
  var $itemId = $('#itemId')
  var $stockForm = $('#stockForm')
  var $sellForm = $('#sellForm')
  var $sizeSell = $('#sizeSell')
  var $sellCount = $('#sellCount')
  var $itemSell = $('#itemSell')
  var $sellPrice = $('#sellPrice')
  var $addItemBtn = $('#addItemBtn')
  var $addType = $('#addType')
  var $typeForm = $('#typeForm')
  var $addTypeBtn = $('#addTypeBtn')
  var $stockSize = $('#size')

  hide($addEditItem)
  hide($items)
  hide($addStock)
  hide($sellItem)
  hide($addItemBtn)
  hide($addType)
  if (token) {
    hide($login)
    fetchItems()
    fetchTypes()
  } else {
    show($login)
    hide($addTypeBtn)
    hide($addItemBtn)
  }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault()

    fetch(apiURL + '/login', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: $('#username').value.toLowerCase(),
        password: $('#password').value
      })
    })
    .then(res => res.json())
    .then(json => {
      token = json.token
      localStorage.setItem('token', token)
      fetchTypes()
      fetchItems()
      hide($login)
      show($addTypeBtn)
      show($addItemBtn)
    })
    .catch(console.error)
  })

  $addTypeBtn.addEventListener('click', function (e) {
    resetForm()
    show($addType)
    hide($addTypeBtn)
    hide($addItemBtn)
    hide($items)
    scrollTo(0, 120)
  })

  $addItemBtn.addEventListener('click', function (e) {
    resetForm()
    show($addEditItem)
    hide($items)
    hide($addTypeBtn)
    hide($addItemBtn)
    scrollTo(0, 120)
  })

  $('#buyingPrice').addEventListener('change', function (e) {
    var $sellingPrice = $('#sellingPrice')
    $sellingPrice.value = getSellingPrice(+e.target.value, 10, 100)
  })

  $('#cancelItemBtn').addEventListener('click', resetForm)
  $('#cancelStockBtn').addEventListener('click', resetForm)
  $('#cancelSellBtn').addEventListener('click', resetForm)
  $('#cancelTypeBtn').addEventListener('click', resetForm)

  $typeForm.addEventListener('submit', e => {
    fetch(apiURL + '/api/types', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + token
      },
      body: JSON.stringify({
        name: $('#typeName').value,
        createdDate: new Date().toISOString()
      })
    })
    .then(res => res.json())
    .then(json => {
      fetchTypes()
      fetchItems()
      show($addItemBtn)
    })
    .catch(console.error)
    resetForm()
  })

  $itemForm.addEventListener('submit', function (e) {
    e.preventDefault()

    var data = {}
    for (var i = 0, l = $itemForm.length; i < l; ++i) {
      var input = $itemForm[i]
      if (input.name) data[input.name] = input.value
    }

    if (data.id) {
      var id = data.id
      delete data.id
      data.updatedDate = new Date().toISOString()
      fetch(apiURL + '/api/items/' + id, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + token
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(json => {
        resetForm()
        fetchItems()
      })
      .catch(console.error)
    } else {
      delete data.id
      data.createdDate = new Date().toISOString()
      fetch(apiURL + '/api/items', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + token
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(json => {
        fetchItems()
      })
      .catch(console.error)
    }
    resetForm()
  })

  $stockSize.addEventListener('change', e => {
    var stockResult = stocks.filter(s => $('#itemId').value === s.itemId && e.target.value === s.size)
    var s = stockResult.length && stockResult[0]
    e.target.dataset.stockid = s ? s.id : ''
    $('#count').value = s ? s.count : ''
  })

  $stockForm.addEventListener('submit', function (e) {
    var data = {}
    for (var i = 0, l = $stockForm.length; i < l; ++i) {
      var input = $stockForm[i]
      if (input.name) data[input.name] = input.value
    }

    if ($stockSize.dataset.stockid) {
      fetch(apiURL + '/api/stocks/' + $stockSize.dataset.stockid, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + token
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
        .then(json => {
          fetchItems()
        })
      .catch(console.error)
    } else {
      fetch(apiURL + '/api/stocks', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + token
        },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(json => {
        fetchItems()
      })
      .catch(console.error)
    }
    resetForm()
  })

  $sellForm.addEventListener('submit', function (e) {
    e.preventDefault()

    var count = +$sizeSell.options[$sizeSell.selectedIndex].dataset.count
    var sellCount = +$sellCount.value
    if (sellCount <= count) {
      fetch(apiURL + '/api/stocks/' + $('#sizeSell').value, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + token
        },
        body: JSON.stringify({ count: count - sellCount })
      })
      .then(res => res.json())
      .then(json => {
        fetchItems()
        fetch(apiURL + '/api/sales/', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + token
          },
          body: JSON.stringify({
            itemId: $itemSell.dataset.itemid,
            count: sellCount,
            price: $sellPrice.value,
            comments: $('#sellComments').value,
            createdDate: new Date().toISOString()
          })
        })
        .then(res => console.log(res.ok))
        .catch(console.error)

        resetForm()
      })
      .catch(console.error)
    }
  })

  document.body.addEventListener('click', function (e) {
    var data = e.target.dataset.item && JSON.parse(atob(e.target.dataset.item))

    if (e.target.id === 'sellBtn') {
      var options = ''
      stocks.map(s => {
        if (s.itemId === data.id + '' && s.count) {
          options += '<option value="' + s.id + '" data-count="' + s.count + '">' + s.size + '</option>'
        }
      })
      $sizeSell.innerHTML = options
      $itemSell.value = data.sku + ' - ' + data.name
      $itemSell.dataset.itemid = data.id
      $sellPrice.value = data.sellingPrice
      var count = $sizeSell.options[$sizeSell.selectedIndex].dataset.count
      $sellCount.value = $sellCount.max = count
      $sizeSell.addEventListener('change', e => {
        count = $sizeSell.options[$sizeSell.selectedIndex].dataset.count
        $sellCount.value = $sellCount.max = count
      })
      show($sellItem)
      hide($items)
      hide($addTypeBtn)
      hide($addItemBtn)
    } else if (e.target.id === 'editBtn') {
      $addEditTitle.innerText = 'Edit'
      $addEditItemBtn.value = 'Update'

      hide($items)
      hide($addTypeBtn)
      hide($addItemBtn)

      for (var i = 0, l = $itemForm.length; i < l; ++i) {
        var input = $itemForm[i]
        if (input.name) input.value = data[input.name]
      }
      show($addEditItem)
      scrollTo(0, 120)
    } else if (e.target.id === 'showAddStockBtn') {
      console.log(e.target.dataset.itemid)
      $itemId.value = e.target.dataset.itemid
      show($addStock)
      hide($items)
      hide($addTypeBtn)
      hide($addItemBtn)
    }
  })


  var lastScrollTop = 0
  window.addEventListener("scroll", () => {
    var st = window.pageYOffset || document.documentElement.scrollTop
    var diff = st - lastScrollTop
    if (Math.abs(diff) < 140) return
    [$addTypeBtn, $addItemBtn].map($fab => {
      if (st > lastScrollTop) {
        setTimeout(() => $fab.classList.add('hidden'), 500)
        $fab.classList.add('visually-hidden')
      } else {
        $fab.classList.remove('hidden')
        setTimeout(() => $fab.classList.remove('visually-hidden'), 10)
      }
    })
    lastScrollTop = st
  }, false)

  function getSellingPrice () {
    var price = arguments[0]
    for (var i = 1; i < arguments.length; i++) {
      price += (arguments[0] * arguments[i] / 100)
    }
    return Math.round(price)
  }

  function resetForm () {
    hide($addEditItem)
    hide($addStock)
    hide($sellItem)
    hide($addType)
    $addEditTitle.innerText = $addEditItemBtn.value = 'Add'
    $itemForm.reset()
    $stockForm.reset()
    $sellForm.reset()
    $typeForm.reset()
    show($items)
    show($addTypeBtn)
    show($addItemBtn)
  }

  function fetchTypes () {
    show($items)
    show($addItemBtn)
    fetch(apiURL + '/api/types', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + token
      }
    })
    .then(res => res.json())
    .then(json => {
      if (!json.length) {
        show($addType)
        hide($addItemBtn)
        hide($addTypeBtn)
        hide($items)
      } else {
        types = json
        hide($addType)
        bindTypes()
      }
    })
    .catch(err => {
      console.error(err)
      show($login)
      hide($items)
    })
  }

  function bindTypes () {
    var options = ''
    Object.keys(types).map(key => {
      options += '<option value="' + types[key].id + '">' + types[key].name + '</option>'
    })
    $typeId.innerHTML = options
    $typeId.value = 1
  }

  function bindItems () {
    var options = ''
    Object.keys(items).map(key => {
      options += '<option value="' + items[key].id + '">' + items[key].sku + ' - ' + items[key].name + '</option>'
    })
    $itemId.innerHTML = options
  }

  function fetchItems() {
    show($items)
    var itemsTable = '<table><tr><th>SKU</th><th>Name</th><th>Type</th><th>Description</th><th>Stock</th><th>Buying</th><th>Selling</th><th>Actions</th></tr>'

    var getHeaders = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Basic ' + token
      }
    }
    fetch(apiURL + '/api/stocks', getHeaders)
      .then(res => res.json())
      .then(data => {
        stocks = data
        fetch(apiURL + '/api/items', getHeaders)
          .then(res => res.json())
          .then(data => {
            items = data
            if (!items.length) {
              $items.innerHTML = 'Click on the (+) button to add a new items.'
              return
            }
            bindItems()
            items.map(item => {
              var base64Item = btoa(JSON.stringify(item))
              var sizeRow = '<div class="table small"><div class="table-row"><div class="table-col">S</div>'
              var countRow = '<div class="table-row"><div class="table-col">C</div>'
              var count = 0
              stocks.map(s => {
                if (s.itemId === item.id + '' && +s.count) {
                  sizeRow += '<div class="table-col">' + s.size + '</div>'
                  countRow += '<div class="table-col">' + s.count + '</div>'
                  count += +s.count
                }
              })
              sizeRow += '<input id="showAddStockBtn" type="button" data-itemid="' + item.id + '" class="tiny" value="+" /></div>'
              countRow += '<strong class="total">' + count + '</strong></div></div>'
              itemsTable += '<tr>' +
                '<td data-th="SKU">' + item.sku + '</td>' +
                '<td data-th="Name">' + item.name + '</td>' +
                '<td data-th="Type">' + (types.filter(t => t.id + '' === item.typeId))[0].name + '</td>' +
                '<td data-th="Description">' + item.description + '</td>' +
                '<td data-th="Stock">' + sizeRow + countRow + '</td>' +
                '<td data-th="Buying">Rs. ' + item.buyingPrice + '</td>' +
                '<td data-th="Selling">Rs. ' + item.sellingPrice + '</td>' +
                '<td style="display: flex;" data-th="Actions"><input id="sellBtn" class="small" type="button" data-item="' + base64Item + '" value="Sell" />' +
                '<input id="editBtn" class="small" type="button" data-item="' + base64Item + '" value="Edit" /></td>' +
                '</tr>'
            })
            $items.innerHTML = itemsTable + '</table>'
          })
        .catch(err => {
          console.error(err)
          hide($login)
        })
      })
      .catch(console.error)
  }
})()
