<?php
namespace LaraCore\Http\Operations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

trait  CrudOperationsInertia
{

use CrudOperations;
    // private $view_path,$route_path, $data,   $EntityModel  ;
    private $custom_view_edit=false,$custom_view_create=false,
    $custom_view_index=false,$custom_view_show;
private $view_edit="settings::crud.edit";
private $view_create="settings::crud.create";
private $view_show="settings::crud.show";

public function index()
{


$list=$this->EntityModel::paginate(10);
$_cols=$this->columns;
$columns=getColsFilter($_cols,"panel",5);
$view = "$this->view_path/index";
return Inertia::render($view ,['list'=>$list,'columns'=>$columns]);


}

 public function store( Request $request)
    {

$validate=new $this->data->StoreRequest();


          $request->validate(   $validate->rules()   );
          DB::beginTransaction();


        try {
            $entity= $this->attach($request );
            DB::commit();

//         if (request()->ajax()) {


// 			return response([
// 					'message' => __('created_successfully'),
// 					'status'  => true,
// 					'id'      => $entity->id,
// 				], 200);
// 		} else
// {
    successCreate();
    return redirect()->route("$this->route_name.index");
// }


        }
        catch (\Exception $e){
            DB::rollback();

            return redirect()->back()
            ->withInput()
            ->withErrors(['error' => $e->getMessage()]);
        }
    }
    public function update(Request $request, $id)
    {
        $validate=new $this->data->StoreRequest();
        $request->validate(   $validate->rules()   );
        try {

        $entity = $this->EntityModel::findOrFail($id);
        $entity=   $this->attach($request,$entity);

        // if (request()->ajax()) {
		// 	return response([
		// 			'message' => __('updated_successfully'),
		// 			'status'  => true,
		// 			'id'      => $entity->id,
		// 		], 200);
		// }else
        successUpdate();
        return redirect()->route("$this->route_name.index");
    }
    catch (\Exception $e){
        return redirect()->back() ->withInput() ->withErrors(['error' => $e->getMessage()]);
    }

    }

    public function create()
    {


        $data=$this->data;

        // if (view()->exists("$this->view_path.create")) {
            $view = "$this->view_path/create";
        // } else {
        //     $view = "settings::crud.create";
        // }
        $entity=$this->entity;
        // if(!$this->custom_view_create)
        // return view("settings::crud.create"  ,compact('data' ));
        return Inertia::render($view  ,['entity'=>$entity ],$this->getViewVars('create'));
    }


    public function edit(   $id)
    {
        $entity = $this->EntityModel::findOrFail($id);
        $data=$this->data;

        $this-> entity=$entity;
        // if(request()->ajax())
        // $view="$this->view_path._field";
        //  else if(!$this->custom_view_edit)
        // $view="settings::crud.edit";
        // else
        $view="$this->view_path/create";
        return Inertia::render($view, ['entity'=>$entity ],$this->getViewVars('edit'));
    }
    public function show($id)
    {
        $data=$this->data;
        $entity =  $this->EntityModel::findOrFail($id);
        $this-> entity=$entity;
        if(request()->ajax())
        return view("$this->view_path._show-content"  ,compact('entity' ,'data' ));

        if(!$this->custom_view_show)
        return view("settings::crud.show"  ,compact('entity' ,'data' ));

        return view("$this->view_path.show", compact('entity','data'));
    }


    public function destroy(Request $request,$id)
    {
        $redirect=$request->redirect??null;

try {
        $entity = $this->EntityModel::findOrFail($id);
        // $myRequest = new \Illuminate\Http\Request();
        //   request()->setMethod('GET'); //set the Request method
        //   $request ->setMethod('GET'); //set the Request method




        $entity->delete();
    }
    catch (\Exception $e){



        return redirect()->back() ->withInput() ->withErrors(['error' => $e->getMessage()]);
    }
        // successDelete();

        if (request()->ajax()&&$redirect!='index')
        {


            return response()->json([
                'success' => true,
                'msg' => 'تمت العملية بنجاح'

            ]);
        }
        successProcess();


        return redirect() ->route("$this->route_name.index");

    }



}
